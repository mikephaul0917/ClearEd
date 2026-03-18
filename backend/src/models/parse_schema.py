import os
import re

model_dir = r"c:\Users\phaul\Documents\CS PROJECTS\E-CLEARANCE\backend\src\models"

def parse_models():
    mermaid = ["erDiagram"]
    
    for filename in os.listdir(model_dir):
        if not filename.endswith(".ts"):
            continue
            
        model_name = filename.split(".")[0]
        filepath = os.path.join(model_dir, filename)
        
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
            
            # Find interface definition to get fields
            interface_match = re.search(r"export\s+interface\s+I[a-zA-Z0-9_]+\s*(?:extends\s+Document\s*)?{([^}]+)}", content, re.IGNORECASE)
            
            fields = []
            if interface_match:
                interface_body = interface_match.group(1)
                # Parse fields
                for line in interface_body.split("\n"):
                    line = line.strip()
                    if not line or line.startswith("//") or line.startswith("/*") or line.startswith("*"):
                        continue
                        
                    # Match property: type
                    prop_match = re.match(r"([a-zA-Z0-9_]+)\??\s*:\s*([^;]+);", line)
                    if prop_match:
                        prop_name = prop_match.group(1)
                        prop_type = prop_match.group(2).strip()
                        fields.append((prop_name, prop_type))
            
            # Add entity to mermaid
            mermaid.append(f"    {model_name} {{")
            for prop_name, prop_type in fields:
                # Clean up type for mermaid
                clean_type = prop_type.replace(" ", "").replace('"', "").replace("'", "").replace("|", "_or_")
                if "mongoose.Types.ObjectId" in clean_type:
                    clean_type = "ObjectId"
                elif "Date" in clean_type:
                    clean_type = "Date"
                elif "string" in clean_type:
                    clean_type = "string"
                elif "number" in clean_type:
                    clean_type = "number"
                elif "boolean" in clean_type:
                    clean_type = "boolean"
                
                mermaid.append(f"        {clean_type} {prop_name}")
            mermaid.append("    }")
            
            # Find relations (ref: 'ModelName')
            # Look inside Schema definitions
            refs = re.findall(r"([a-zA-Z0-9_]+)\s*:\s*{[^}]*ref\s*:\s*['\"]([a-zA-Z0-9_]+)['\"]", content)
            for ref_field, ref_model in refs:
                mermaid.append(f"    {model_name} }}o--|| {ref_model} : \"{ref_field}\"")

            # array refs e.g. [{ type: Schema.Types.ObjectId, ref: 'Model' }]
            array_refs = re.findall(r"([a-zA-Z0-9_]+)\s*:\s*\[\s*{\s*type\s*:\s*Schema\.Types\.ObjectId\s*,\s*ref\s*:\s*['\"]([a-zA-Z0-9_]+)['\"]\s*}\s*\]", content)
            for ref_field, ref_model in array_refs:
                mermaid.append(f"    {model_name} }}o--|{{ {ref_model} : \"{ref_field}\"")

    with open(r"c:\Users\phaul\Documents\CS PROJECTS\E-CLEARANCE\backend\src\models\er_diagram.mermaid", "w", encoding="utf-8") as f:
        f.write("\n".join(mermaid))
        print("Diagram written to backend/src/models/er_diagram.mermaid")

if __name__ == "__main__":
    parse_models()
