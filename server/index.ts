import { app } from "./app";

const port = Number.parseInt(process.env.PORT || process.env.API_PORT || "4000", 10);

app.listen(port, () => {
  console.log(`Tier testing API listening on http://localhost:${port}`);
});
