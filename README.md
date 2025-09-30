# VereinOnline-API-Client

TypeScript reusable API client for VereinOnline.

## Features

This API client provides a reusable TypeScript interface for interacting with
the VereinOnline API. It includes the following modules:

### `ApiClient`

- Manages authentication and API requests.
- Provides methods for logging in, logging out, and fetching data from the API.
- Acts as a central hub for accessing the `MembersApi` and `GroupsApi`.

### `MembersApi`

- Fetch members by search term, role, group, or other filters.
- Retrieve detailed information about a specific member by their ID.
- Update member information with partial updates.

### `GroupsApi`

- Fetch a list of groups from the API.

### Key Features

- Strongly typed interfaces for `Member` and `Group` objects.
- Flexible query options for filtering and sorting.
- Built-in error handling for API responses.
- Automatic double-encoding fix for JSON strings:
  - Transparently decodes VereinOnline's double-encoded JSON responses, ensuring
    special characters (like "ü" and "ß") are correctly represented.
  - Example: Converts `{"text":"f\u00c3\u00bcr --- gro\u00c3\u009f"}` to
    `{"text":"für --- groß"}` automatically.
  - No manual decoding required—API responses are always properly decoded for
    you.

## Usage

### Using Deno

To use this module in your Deno project, import it directly from the module's
URL:

```ts
import { ApiClient } from "jsr:@kjg-bad-abbach/vereinonline-api-client";

const client = new ApiClient("https://www.vereinonline.org/IHRVEREIN/");

async function main() {
  await client.login("username", "password");

  // Fetch members
  const members = await client.members.get({ searchTerm: "John" });
  console.log(members);

  // Fetch groups
  const groups = await client.groups.get();
  console.log(groups);

  // Update a member
  const updatedMember = await client.members.update("123", { vorname: "Jane" });
  console.log(updatedMember);

  client.logout();
}

// Learn more at https://docs.deno.com/runtime/manual/examples/module_metadata#concepts
if (import.meta.main) {
  main().catch(console.error);
}
```

### Using npm

To use this module in a Node.js project, install it via npm:

```bash
npm install jsr:@kjg-bad-abbach/vereinonline-api-client
```

Then, import it in your JavaScript or TypeScript file:

```ts
import { ApiClient } from "@kjg-bad-abbach/vereinonline-api-client";

const client = new ApiClient("https://www.vereinonline.org/IHRVEREIN/");

async function main() {
  await client.login("username", "password");

  // Fetch members
  const members = await client.members.get({ searchTerm: "John" });
  console.log(members);

  // Fetch groups
  const groups = await client.groups.get();
  console.log(groups);

  // Update a member
  const updatedMember = await client.members.update("123", { vorname: "Jane" });
  console.log(updatedMember);

  client.logout();
}

main().catch(console.error);
```

## Debugging using a MITM Proxy

To debug the API requests and responses, you can use a MITM proxy like [mitmproxy](https://mitmproxy.org/). Here's how to set it up:

1. Create a `.env` file in the root of this project with the following content:

   ```env
   MITMWEB_PROXY_TARGET="https://www.vereinonline.org"
   MITMWEB_PASSWORD="<some new random password>"
   ```

2. Start the mitmproxy service using Docker Compose:

   ```bash
   docker-compose up -d
   ```

3. Configure your `ApiClient` to use the proxy:

   ```ts
   const client = new ApiClient("http://localhost:8080/IHRVEREIN/"); // HTTP, not HTTPS because in Deno and Node.js trusting the mitmproxy CA is complicated and cookies are not required
   ```

   or open the browser at: `https://localhost:8080/IHRVEREIN/` (HTTPS required that the cookies work; you will have to trust the mitmproxy CA certificate in your browser)

4. Access the mitmproxy web interface at `http://localhost:8081` and log in using the password you set in the `.env` file.

5. You can now inspect the API requests and responses in the mitmproxy web interface.
