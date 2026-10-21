import httpx

reports_to_process = [
    (4, r'storage\uploads\dd0914a4-c940-4c79-b81c-8bc013938007.pdf', 'Tifide Report.pdf', 'application/pdf'),
    (5, r'storage\uploads\8b5b1eee-1c0d-4235-93e2-c77e47a7f758.jpeg', 'WhatsApp Image 2026-10-19 at 6.26.02 PM.jpeg', 'image/jpeg'),
    (6, r'storage\uploads\6e3fc160-f5ed-421a-b93c-2aaac4245180.pdf', 'Tifide Report.pdf', 'application/pdf'),
    (7, r'storage\uploads\77f9fbce-c8bc-4704-89f5-344761d47276.jpeg', 'WhatsApp Image 2026-10-20 at 4.47.42 PM.jpeg', 'image/jpeg'),
]

sql_commands = []

for rid, path, fname, mtype in reports_to_process:
    with open(path, 'rb') as f:
        data = f.read()
    files = {'file': (fname, data, mtype)}
    r = httpx.post('http://localhost:8000/process-report', headers={'X-API-Key': 'change-me-internal-key'}, files=files, timeout=60.0)
    if r.status_code != 200:
        print(f'Report {rid} failed with status {r.status_code}: {r.text}')
        continue
    resp = r.json()
    lab_name = resp.get('lab_name') or ''
    if lab_name:
        clean_lab = lab_name.replace("'", "''")
        lab_name_sql = f"'{clean_lab}'"
    else:
        lab_name_sql = 'NULL'
        
    rep_date = resp.get('report_date')
    rep_date_sql = f"'{rep_date}'" if rep_date else 'CURRENT_DATE'
    
    sql_commands.append(f"UPDATE reports SET status = 'DONE', error_message = NULL, lab_name = {lab_name_sql}, report_date = {rep_date_sql} WHERE id = {rid};")
    sql_commands.append(f"DELETE FROM lab_results WHERE report_id = {rid};")
    
    for row in resp.get('results', []):
        tname = row['test_name'].replace("'", "''")
        rname = (row.get('raw_name') or row['test_name']).replace("'", "''")
        val = row['value']
        unit = f"'{row['unit']}'" if row.get('unit') else 'NULL'
        rlow = row['ref_low'] if row.get('ref_low') is not None else 'NULL'
        rhigh = row['ref_high'] if row.get('ref_high') is not None else 'NULL'
        rtext = f"'{row['ref_text']}'" if row.get('ref_text') else 'NULL'
        flag = row.get('flag', 'NORMAL')
        slevel = row.get('safety_level', 'GREEN')
        conf = row.get('confidence', 0.9)
        nrev = 'true' if row.get('needs_review') else 'false'
        
        sql_commands.append(
            f"INSERT INTO lab_results (report_id, test_name, raw_name, value, unit, ref_low, ref_high, ref_text, flag, safety_level, confidence, needs_review, edited_by_doctor) "
            f"VALUES ({rid}, '{tname}', '{rname}', {val}, {unit}, {rlow}, {rhigh}, {rtext}, '{flag}', '{slevel}', {conf}, {nrev}, false);"
        )

full_sql = '\n'.join(sql_commands)
with open('update_reports.sql', 'w', encoding='utf-8') as f:
    f.write(full_sql)
print('Saved update_reports.sql successfully with', len(sql_commands), 'statements.')
