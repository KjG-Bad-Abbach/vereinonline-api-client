import { ApiClient } from "../src/api/client.ts";
import process from "node:process";

console.log("Testing ApiClient...");
const client = new ApiClient(
  process.env.VEREINONLINE_BASE_URL !== undefined
    ? process.env.VEREINONLINE_BASE_URL
    : (() => {
      throw new Error("VEREINONLINE_BASE_URL is not set");
    })(), // "https://www.vereinonline.org/IHRVEREIN/"
);
await client.login(
  process.env.VEREINONLINE_USER ?? "",
  process.env.VEREINONLINE_PASSWORD ?? "",
);
console.log("Login successful.");

console.log("Testing getGroups...");
const groups = await client.groups.get();
for (const group of groups) {
  console.log(`Group ID: ${group.id}`);
  console.log(`JSON: ${JSON.stringify(group, null, 2)}`);
  //   console.log(`Group Name: ${group.name}`);
  console.log("-----------------------------");
}
console.log("Groups fetched successfully.");
