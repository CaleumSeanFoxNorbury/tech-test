import express from "express";
import fs from "fs";

const app = express();
const port = 3000;

app.use((req, res, next) => {
    // Allowed requests from any origin, needs restricting if required 
    res.setHeader("Access-Control-Allow-Origin", "*"); 
    next();
});

app.get("/", (req, res) => {
    try {        
        // page and page size for pagination
        const page = req.query.page ? parseInt(req.query.page as string) : 1; 
        const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string) : 6;
        // Calculate start and end indices for pagination
        const startIndex = (page - 1) * pageSize;
        const endIndex = page * pageSize;
       
        const data = JSON.parse(fs.readFileSync("src/data.json", "utf8"));

        const paginatedData = data.slice(startIndex, endIndex);

        // Send paginated data (JSON)
        res.json({
            currentPage: page,
            pageSize: pageSize,
            totalItems: data.length,
            totalPages: Math.ceil(data.length / pageSize),
            data: paginatedData
        });
    } catch (error) {
        console.error("Error reading data:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});