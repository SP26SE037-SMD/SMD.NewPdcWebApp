path = 'src/services/po.service.ts'
with open(path, 'r') as f:
    text = f.read()

text = text.replace(
    "const query = new URLSearchParams();",
    "const query = new URLSearchParams();\n        if (params?.page === undefined) query.append('page', '0');\n        if (params?.size === undefined) query.append('size', '100');"
)

with open(path, 'w') as f:
    f.write(text)
print("Done fixing PO service!")
