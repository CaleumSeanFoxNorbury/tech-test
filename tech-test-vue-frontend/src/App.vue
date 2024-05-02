<script setup lang="ts">
  import axios from 'axios';
  import { ref } from 'vue';

  interface ReturnObjectType {
    name: string;
    priceInPounds: number;
    status: string;
    categories: string[];
  }

  // state
  const responseData = ref<ReturnObjectType[]>([]);
  const deletedObjectIndexes = ref<string[]>([]);
  const filteredObjectIndexes = ref<string[]>([]);
  const pageSize = 6;
  let currentPage = 1;
  let totalPages: number = 0;
  let sortedColumn: string;
  let sortDirection: number = 1;
  let selectedStatuses: { index: number; value: string }[] = [];

  function getData(resetData: boolean = false){
    if(resetData){
      currentPage = 1;
      deletedObjectIndexes.value = [];
      filteredObjectIndexes.value = [];
    }

    axios.get('http://localhost:3000/', {
      params: {
        page: currentPage,
        pageSize: pageSize
      }
    })
    .then(response => {
      // reset filter text
      const inputElement = <HTMLInputElement>document.getElementById('filter');
      if (inputElement) {
          inputElement.value = '';
          filteredObjectIndexes.value = [];
      }
      
      // setting total pages for max, min page position
      totalPages = response.data.totalPages;

      // Set the response data to the reactive variable
      responseData.value = response.data.data;

      // apply changed status without backend change
      applySelectedStatuses();
    })
    .catch(error => {
      console.error('Error fetching data:', error);
    });
  };

  function fetchNextPage(){
    // Increment current page and fetch paginated data
    currentPage++; 
    getData();
  };

  function fetchPreviousPage(){
    // Decrement current page and fetch paginated data
    currentPage--; 
    getData();
  };

  function deleteRow(key: string){
    deletedObjectIndexes.value.push(key);

    // send api call to save manipulation on the backend/database
  };

  function resetFilters(){
    deletedObjectIndexes.value = [];
    filteredObjectIndexes.value = [];
  }

  function filterByText(event: any){
    let filter = event.target.value.toLowerCase();
    filteredObjectIndexes.value = [];

    if (filter.trim() === '') {
      // dont filter if filter is empty
      return; 
    }

    responseData.value.forEach(v => {
        // Check if the filter matches any of the objects values
        if (!v.name.toLowerCase().includes(filter) &&
            !v.priceInPounds.toString().includes(filter) &&
            !v.status.toString().toLowerCase().includes(filter) &&
            !v.categories.some(category => category.toLowerCase().includes(filter))) {
            filteredObjectIndexes.value.push(v.name);
        }
    });
  }

  function saveStatus(index: number){
    const statusValue = responseData.value[index].status;
    const existingIndex = selectedStatuses.findIndex(obj => obj.index === index);

    if (existingIndex !== -1) {
      selectedStatuses[existingIndex].value = statusValue;
    } else {
      selectedStatuses.push({ index, value: statusValue });
    }
  }

  function applySelectedStatuses() {
    selectedStatuses.forEach(obj => {
      responseData.value[obj.index].status = obj.value;
    });
  }

  function sortColumn(column: string) {
    if (sortedColumn === column) {
      sortDirection *= -1;
    } else {
      sortedColumn = column;
      sortDirection = 1;
    }    

    responseData.value.sort((a, b) => {
      // using any here to get rid of ts warnings
      const valueA = (a as any)[column];
      const valueB = (b as any)[column];

      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return sortDirection * valueA.localeCompare(valueB);
      } else {
        return sortDirection * ((Number(valueA) ?? 0) - (Number(valueB) ?? 0));
      }
    });
  }

  // fetch inital data
  getData();
</script>

<template>
  <div>
    <div class="row aicenter spacebetween p-2.5 w-4/5 m-auto" style="margin-bottom: 10px;">
      <div>
        <h1 class="text-sm">3D Group technical assessment - Vue frontend test</h1>
      </div>
      <div class="row aicenter jccenter">
        <button @click="resetFilters()" class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded inline-flex items-center">
          <div class="mr-2"><span>&#8634;</span></div>
          <span>Reset</span>
        </button>
        <input @input="filterByText($event)" type="text" id="filter" class="mx-2.5 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Search By Text" />
      </div>
    </div>
    <div class="relative overflow-x-auto shadow-md sm:rounded-lg">
      <table class="w-4/5 text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400 m-auto">
        <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
          <tr>
            <th v-for="(key, keyIndex) in Object.keys(responseData[0])" :key="key" scope="col" class="py-3" :class="{ 'px-6': keyIndex === 0 }" @click="sortColumn(key)" style="cursor: pointer;">
              <span>{{ key.replace(/([a-z])([A-Z])/g, '$1 $2') }}</span>
              <span>
                <svg v-if="sortDirection === 1" xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 inline-block align-middle" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7l5-5 5 5M7 17l5 5 5-5"></path>
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 inline-block align-middle" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17l-5 5-5-5M7 7l5-5 5 5"></path>
                </svg>
              </span>
            </th>
            <th scope="col" class="py-3"></th> <!-- row actions -->
          </tr>
        </thead>
        <tbody>
          <!-- Iterate over the data being returned and render each object as a table row -->
          <tr v-for="(item, index) in responseData" :key="item.name" :id="index.toString()" v-show="!deletedObjectIndexes.includes(item.name) && !filteredObjectIndexes.includes(item.name)" class="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
            <th scope="row" class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
              {{ item.name }}
            </th>
            <td>{{ item.priceInPounds }}</td>
            <td>
              <div class="mb-3">
                <select 
                  id="status-{{index.toString()}}" 
                  v-model="item.status" 
                  class="form-select w-3/4"
                  @change="saveStatus(index)"
                >
                  <option value="pendingReview">Pending Review</option>
                  <option value="active">Active</option>
                  <option value="disabled">Disabled</option>
                </select>
              </div>
            </td>
            <td>
              <!-- join categories with commas -->
              {{ Array.isArray(item.categories) ? item.categories.join(', ') : item.categories }}
            </td>
            <td><div @click="deleteRow(item.name)" class="icon"><span>Delete</span></div></td>
          </tr>
        </tbody>
      </table>
      <div class="w-4/5 m-auto p-3">
        <div class="row aicenter jcend">
          <a v-if="totalPages > 1 && currentPage > 1" @click="fetchPreviousPage()" class="row aicenter jccenter px-3 h-8 me-3 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">
            <svg class="w-3.5 h-3.5 me-2 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10">
              <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5H1m0 0 4 4M1 5l4-4"/>
            </svg>
            Previous
          </a>
          <a v-if="totalPages > 1 && currentPage < totalPages" @click="fetchNextPage()" class="row aicenter jccenter px-3 h-8 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">
            Next
            <svg class="w-3.5 h-3.5 ms-2 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10">
              <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M1 5h12m0 0L9 1m4 4L9 9"/>
            </svg>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.m-auto{
  margin: 0 auto;
}

.btn{
  padding: 20px;  
  border-radius: 15px;
  border: 1px solid blue;
  color: white;
  background-color: blue;
  font-weight: bold;  
  cursor: pointer;
} 

.icon{
  padding: 10px;
  font-size: 20px;
  cursor: pointer;
}

.row{
  display: flex;
  flex-direction: row;
} 

.aicenter{
  align-items: center;
} 

.jccenter{
  justify-content: center;
}

.spacebetween{
  justify-content: space-between;
}

.jcend{
  justify-content: flex-end;
}

.textcenter{
  text-align: center;
}
</style>
