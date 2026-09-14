import fs from 'node:fs';

const path = 'src/pages/PropertyDetail.jsx';
let source = fs.readFileSync(path, 'utf8');
let changed = false;

function replaceExactlyOnce(oldText, newText, label) {
  if (source.includes(newText)) {
    console.log(`already repaired: ${label}`);
    return;
  }
  const count = source.split(oldText).length - 1;
  if (count !== 1) {
    throw new Error(`${label}: expected exactly one repair target, found ${count}`);
  }
  source = source.replace(oldText, newText);
  changed = true;
  console.log(`repaired: ${label}`);
}

replaceExactlyOnce(
  'import { base44 } from "@/api/base44Client";\n',
  'import { base44 } from "@/api/base44Client";\nimport { useAuth } from "@/lib/AuthContext";\n',
  'PropertyDetail auth context import'
);

replaceExactlyOnce(
  '  const [user, setUser] = useState(null);\n',
  '  const { user } = useAuth();\n',
  'PropertyDetail shared auth state'
);

replaceExactlyOnce(
  '      const [p, u] = await Promise.all([\n        base44.entities.Property.get(id),\n        base44.auth.me().catch(() => null)\n      ]);\n      if (!alive) return;\n      setProperty(p); setUser(u);\n',
  '      const p = await base44.entities.Property.get(id);\n      const u = user;\n      if (!alive) return;\n      setProperty(p);\n',
  'PropertyDetail anonymous auth probe'
);

replaceExactlyOnce(
  '  }, [id]);\n',
  '  }, [id, user]);\n',
  'PropertyDetail auth dependency'
);

if (changed) fs.writeFileSync(path, source);
console.log(JSON.stringify({ changed, path }));
