import docx

doc = docx.Document("docs/Team2526-sem2-it332-18_WildcatWelfare_SDD-3 (1).docx")
for i in range(25, 35):
    p = doc.paragraphs[i]
    has_drawing = "w:drawing" in p._p.xml
    print(f"P{i} [{p.style.name}]: text='{p.text}', has_drawing={has_drawing}")
