import { createApp } from "./app.js";



const app = createApp();


const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
  console.log(`Health: http://localhost:${PORT}/api/v1/health`);
});