# 2. Package Manager Linker Strategy: node-modules vs PnP

## Status
Accepted

## Context
We are setting up a monorepo containing a React (Vite) frontend and a NestJS 
backend managed via Yarn Workspaces. We need to decide how Yarn installs 
and links dependencies across these workspaces. 

Yarn offers two main approaches:
1. Plug'n'Play (PnP): Eliminates `node_modules`, providing strict isolation, 
   zero-install capabilities, and faster install times.
2. node-modules: The traditional layout where dependencies are hoisted into physical 
   `node_modules` folders.

Our project relies on ecosystem tools like Vite and NestJS (along with various 
third-party plugins). Many of these packages expect a traditional filesystem 
layout. Using PnP would require switching to `pnpMode: loose` and writing custom 
dependency patches to fix broken imports.

## Decision
We will use the traditional `node-modules` nodeLinker strategy for our monorepo. 
We explicitly reject strict PnP for this project.

To implement this, we will add the following configuration to our `.yarnrc.yml`:
```yaml
nodeLinker: node-modules
```

## Consequences
* **Positive:** High predictability and maximum out-of-the-box compatibility with Vite, NestJS, and third-party libraries.
* **Positive:** No development overhead spent writing package patches or managing loose PnP configurations.
* **Negative:** Slower initial `yarn install` times compared to PnP.
* **Negative:** Disk usage will be higher due to the physical `node_modules` directories.
* **Risk:** Developers must ensure dependencies are correctly declared in individual workspace `package.json` files to avoid relying on accidental hoisting.
