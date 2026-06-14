#!/usr/bin/env node
/*  create-ts-and-cs-templates
 *
 *  Usage:
 *      node create-ts-and-cs-templates.js -s <skeleton-name> -n <name> -t <type> -f <json-file>
 *
 *  Example:
 *      node scaffold-templates.js  -s blogSkeleton -n post -t blog -f mock-posts.json
 *
 *  The script creates:
 *    1. TypeScript files under  `features/service-<name>/`
 *         • slice.ts
 *         • server.ts
 *         • routes/<name>s.ts
 *    2. C# files under  `csharp/`
 *         • SampleData<PascalName>.cs
 *         • <PascalName>Models.cs
 *
 *  After creating the files, the script prints the content of each file to the console.
 */

const fs   = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// 1. Parse command‑line arguments
// ---------------------------------------------------------------------------
const argv = process.argv.slice(2);
const opts = {};

for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
        case '-s':
        case '--skeleton-name':
            opts.skeletonName = argv[++i];
            break;
        case '-n':
        case '--name':
            opts.name = argv[++i];
            break;
        case '-t':
        case '--type':
            opts.type = argv[++i];
            break;
        case '-f':
        case '--file':
            opts.file = argv[++i];
            break;
        default:
            // ignore
            break;
    }
}

const required = ['skeletonName', 'name', 'type', 'file'];
for (const p of required) {
    if (!opts[p]) {
        console.error(`Missing required argument: --${p}`);
        process.exit(1);
    }
}

// ---------------------------------------------------------------------------
// 2. Helpers
// ---------------------------------------------------------------------------
function toPascal(str) {
    return str
        .split(/[-_ ]+/)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join('');
}
function singularize(str) {
    if (str.endsWith('ies')) return str.slice(0, -3) + 'y';
    if (str.endsWith('s'))   return str.slice(0, -1);
    return str;
}
function replace(template, map) {
    return template.replace(/{{\s*(\w+)\s*}}/g, (_, k) => map[k] || '');
}
function inferCSharpType(v) {
    const t = typeof v;
    if (t === 'string')  return 'string';
    if (t === 'number')  return Number.isInteger(v) ? 'int' : 'double';
    if (t === 'boolean') return 'bool';
    if (Array.isArray(v)) return 'List<object>';   // simple fallback
    return 'object';
}
function generateCSharpClass(obj, name) {
    const lines = [];
    lines.push(`public class ${name} {`);
    for (const [k, v] of Object.entries(obj)) {
        lines.push(`    public ${inferCSharpType(v)} ${toPascal(k)} { get; set; }`);
    }
    lines.push(`}`);
    return lines.join('\n');
}
function generateCSharpModels(json) {
    const arrKey = Object.keys(json).find(k => Array.isArray(json[k]));
    if (!arrKey) throw new Error('JSON must contain an array to generate a model.');
    const item = json[arrKey][0];
    const modelName = toPascal(singularize(arrKey));
    const modelCls  = generateCSharpClass(item, modelName);
    const wrapperCls = `
public class Get${modelName}PageResponse {
    public List<${modelName}> ${toPascal(arrKey)} { get; set; }
}
`;
    return `using System.Collections.Generic;\n\n${modelCls}\n\n${wrapperCls}`;
}

// ---------------------------------------------------------------------------
// 3. Read the JSON file
// ---------------------------------------------------------------------------
const jsonContent = fs.readFileSync(opts.file, 'utf8');
const jsonData    = JSON.parse(jsonContent);

// ---------------------------------------------------------------------------
// 4. Create TypeScript files
// ---------------------------------------------------------------------------

// base path for TS code
const tsBase = path.join(process.cwd(), 'features', `service-${opts.name}`);
fs.mkdirSync(tsBase, { recursive: true });

// 4.1 slice.ts
const sliceTemplate = `
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';

interface {{entityName}} {
{{#each attributes}}
  {{name}}: {{type}};
{{/each}}
}

const initialState: {{entityName}}[] = [];

export const {{entityName}}Slice = createSlice({
  name: '{{entityName}}',
  initialState,
  reducers: {
    set{{entityName}}s(state, action: PayloadAction<{{entityName}}[]>) {
      return action.payload;
    }
  }
});

export const { set{{entityName}}s } = {{entityName}}Slice.actions;
export default {{entityName}}Slice.reducer;
`;

const tsSlice = replace(sliceTemplate, {
    entityName: opts.name,
    attributes: Object.entries(jsonData).filter(([k]) => k !== 'data')
        .map(([k, v]) => ({ name: k, type: typeof v })).join('\n')
});

// 4.2 server.ts
const serverTemplate = `
import { get{{entityName}}s } from './api';

export async function fetch{{entityName}}s() {
  return await get{{entityName}}s();
}
`;
const tsServer = replace(serverTemplate, { entityName: opts.name });

// 4.3 route file (e.g. routes/post.ts)
const routeTemplate = `
import { {{entityName}} } from '../store';

export function get{{entityName}}s(): {{entityName}}[] {
  return [
{{#each mockData}}
    {{this}},
{{/each}}
  ];
}
`;
const tsRoute = replace(routeTemplate, {
    entityName: opts.name,
    mockData: jsonContent
});

// Write TS files
const tsSlicePath   = path.join(tsBase, 'slice.ts');
const tsServerPath  = path.join(tsBase, 'server.ts');
const tsRoutePath   = path.join(tsBase, 'routes', `${opts.name}s.ts`);

fs.writeFileSync(tsSlicePath,  tsSlice,  'utf8');
fs.writeFileSync(tsServerPath, tsServer, 'utf8');
fs.writeFileSync(tsRoutePath,  tsRoute,  'utf8');

// ---------------------------------------------------------------------------
// 5. Create C# files
// ---------------------------------------------------------------------------
const csDir = path.join(process.cwd(), 'csharp');
fs.mkdirSync(csDir, { recursive: true });

// 5.1 Sample data file
const csSampleTemplate = `
using System.Collections.Generic;
using Newtonsoft.Json;

public class SampleData
{
  public static List<{{entityName}}?> GetSampleData()
  {
    var json = @\\\`
{{mockJson}}
\\\`;
    return JsonConvert.DeserializeObject<List<{{entityName}}?>>(json);
  }
}
`;
const csSampleContent = replace(csSampleTemplate, {
    entityName: toPascal(opts.name),
    mockJson: jsonContent
});
const csSamplePath = path.join(csDir, `SampleData${toPascal(opts.name)}.cs`);
fs.writeFileSync(csSamplePath, csSampleContent, 'utf8');

// 5.2 Models file
const csModelsContent = generateCSharpModels(jsonData);
const csModelsPath = path.join(csDir, `${toPascal(opts.name)}Models.cs`);
fs.writeFileSync(csModelsPath, csModelsContent, 'utf8');

// ---------------------------------------------------------------------------
// 6. Print the generated code
// ---------------------------------------------------------------------------
console.log('\n=== slice.ts ===');
console.log(tsSlice);

console.log('\n=== server.ts ===');
console.log(tsServer);

console.log('\n=== route.ts ===');
console.log(tsRoute);

console.log(`\n=== SampleData${toPascal(opts.name)}.cs ===`);
console.log(csSampleContent);

console.log(`\n=== ${toPascal(opts.name)}Models.cs ===`);
console.log(csModelsContent);
