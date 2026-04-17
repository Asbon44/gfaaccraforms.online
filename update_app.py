import sys
import json
import re

with open('data.csv', 'r') as f:
    lines = f.read().strip().split('\n')

pins = []
for line in lines:
    if line.strip():
        parts = line.split(',')
        if len(parts) == 2:
            serial, pin = parts[0].strip(), parts[1].strip()
            pins.append({"serial": serial, "pin": pin, "used": False, "formData": None})

pins_json = json.dumps(pins, indent=4)
pins_json_indented = pins_json.replace('\n', '\n        ')

new_init_db = f"""function initDatabase() {{
    if (!localStorage.getItem('gfa_database')) {{
        let pins = {pins_json_indented};
        localStorage.setItem('gfa_database', JSON.stringify(pins));
        console.log("Database initialized with " + pins.length + " pins.");
    }}
}}"""

with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace initDatabase
content = re.sub(r'function initDatabase\(\) \{[\s\S]*?\}\s*\}\n', new_init_db + "\n", content, count=1)


fix_code = """            // Populate data safely
            let data = record.formData;
            for (let key in data) {
                let elems = form.elements[key];
                if (!elems) continue;

                if (elems.length !== undefined && elems.type !== 'select-one') {
                    // Radio buttons or multiple inputs
                    Array.from(elems).forEach(el => {
                        if (el.value === data[key]) el.checked = true;
                    });
                } else {
                    if (elems.type === 'checkbox') {
                        elems.checked = (data[key] === true || data[key] === "on");
                    } else {
                        elems.value = data[key];
                    }
                }
            }

            // Fix read only mode
            Array.from(form.elements).forEach(el => {
                if (el.id !== 'btn-submit') {
                    el.disabled = true;
                }
            });"""

content = content.replace("""            // Populate data safely
            let data = record.formData;
            for (let key in data) {
                let elems = form.elements[key];
                if (!elems) continue;

                if (elems.length !== undefined && elems.type !== 'select-one') {
                    // Radio buttons or multiple inputs
                    Array.from(elems).forEach(el => {
                        if (el.value === data[key]) el.checked = true;
                    });
                } else {
                    if (elems.type === 'checkbox') {
                        elems.checked = (data[key] === true || data[key] === "on");
                    } else {
                        elems.value = data[key];
                    }
                }
            }""", fix_code)


content = content.replace("""            const pUpload = document.getElementById('passport-upload');
            if (pUpload) {
                pUpload.type = "text";
                pUpload.value = "Image stored securely.";
                pUpload.style.border = "none";
                pUpload.style.background = "transparent";
            }""", """            const pUpload = document.getElementById('passport-upload');
            if (pUpload) {
                pUpload.type = "text";
                pUpload.value = "Image stored securely.";
                pUpload.style.border = "none";
                pUpload.style.background = "transparent";
                pUpload.disabled = true;
            }""")

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated app.js")
