import markdown_it
from pathlib import Path
import subprocess

md_path = Path("docs/MVP_VALIDATION_HIGHLIGHTS.md")
md_content = md_path.read_text(encoding="utf-8")

md = markdown_it.MarkdownIt("commonmark", {"breaks": True, "html": True})
html_body = md.render(md_content)

html_template = """<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Task Force Bruno - MVP Validation Highlights</title>
<style>
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    line-height: 1.5;
    color: #1e293b;
    max-width: 860px;
    margin: 0 auto;
    padding: 30px;
    font-size: 13px;
  }
  h1 { font-size: 22px; border-bottom: 2px solid #cbd5e1; padding-bottom: 6px; color: #0f172a; margin-top: 10px; }
  h2 { font-size: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-top: 20px; color: #1e293b; }
  h3 { font-size: 14px; margin-top: 14px; color: #334155; }
  table { border-collapse: collapse; width: 100%; margin: 14px 0; font-size: 12px; page-break-inside: avoid; }
  th, td { border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left; }
  th { background-color: #f1f5f9; font-weight: 600; color: #0f172a; }
  tr:nth-child(even) { background-color: #f8fafc; }
  pre, code { background-color: #f8fafc; font-family: Consolas, monospace; font-size: 11px; }
  pre { padding: 10px; border: 1px solid #e2e8f0; border-radius: 4px; overflow-x: auto; }
  blockquote { border-left: 4px solid #0284c7; margin: 8px 0; padding: 6px 12px; background-color: #f0f9ff; color: #0369a1; }
  hr { border: 0; height: 1px; background: #e2e8f0; margin: 18px 0; }
  ul, ol { padding-left: 20px; }
  li { margin-bottom: 3px; }
</style>
</head>
<body>
""" + html_body + """
</body>
</html>"""

temp_html = Path("docs/temp_highlights.html")
temp_html.write_text(html_template, encoding="utf-8")

edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
pdf_out = Path("docs/Task_Force_Bruno_MVP_Validation_Highlights.pdf").resolve()
cmd = [edge_path, "--headless", "--disable-gpu", f"--print-to-pdf={pdf_out}", str(temp_html.resolve())]
res = subprocess.run(cmd, capture_output=True, text=True)
print("Edge return code:", res.returncode)
if temp_html.exists():
    temp_html.unlink()
print("Generated PDF at:", pdf_out)
