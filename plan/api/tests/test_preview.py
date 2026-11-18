from test_api_flow import app, client, login, rows


def seed(client, h):
    ck = client.post('/api/checkups', headers=h, json={'entry_question':'overview'}).json()
    mid = ck['members'][0]['id']
    for section, value in {
        'incomes':[{'member_id':mid,'amount':{'min':90000,'max':120000}}],
        'expenses':[{'category_key':'life','amount':{'min':95000,'max':95000}}],
        'savings':[{'kind':'account','amount':{'min':30000,'max':30000},'is_safety_fund':True}],
    }.items():
        assert client.put(f"/api/checkups/{ck['id']}/sections/{section}",headers=h,json=value).status_code==200
    return ck['id']


def test_preview_endpoints_are_isolated_read_only_and_consistent(client, app):
    h=login(client,'preview@example.com'); ck=seed(client,h)
    before=client.get(f'/api/checkups/{ck}',headers=h).json()
    events=rows(app,'SELECT count(*) FROM product_events')
    response=client.post(f'/api/checkups/{ck}/preview',headers=h,json={'mode':'sensitivity','section':'incomes','row_index':0})
    assert response.status_code==200,response.text
    assert [p['free_cashflow'] for p in response.json()['endpoints']]==[-5000,25000]
    result=client.post(f'/api/checkups/{ck}/preview',headers=h,json={'mode':'cushion_contribution','monthly_amount':5000,'horizon_months':12}).json()
    assert result['cushion_delta']==60000
    assert result['available_after_contribution']==5000
    assert result['first_shortfall_month'] is None
    for base,alt in zip(result['baseline'],result['alternative']):
        assert base['cash']+base['cushion']==alt['cash']+alt['cushion']
    assert client.get(f'/api/checkups/{ck}',headers=h).json()==before
    assert rows(app,'SELECT count(*) FROM product_events')==events
    other=login(client,'other-preview@example.com')
    body={'mode':'cushion_contribution','monthly_amount':0}
    assert client.post(f'/api/checkups/{ck}/preview',headers=other,json=body).status_code==404
    assert client.post(f'/api/checkups/{ck}/preview',json=body).status_code==401


def test_preview_zero_shortage_validation_and_versions(client, app):
    h=login(client,'preview-boundary@example.com');ck=seed(client,h)
    url=f'/api/checkups/{ck}/preview'
    body={'mode':'cushion_contribution','monthly_amount':0}
    zero=client.post(url,headers=h,json=body).json()
    assert zero['baseline']==zero['alternative']
    huge=client.post(url,headers=h,json={**body,'monthly_amount':1000000}).json()
    assert huge['first_shortfall_month']==1 and huge['cushion_delta']==0
    for patch in [{'monthly_amount':-1},{'horizon_months':0},{'horizon_months':13},{'extra':'no'},{'monthly_amount':'NaN'}]:
        assert client.post(url,headers=h,json={**body,**patch}).status_code==422
    assert client.post(url,headers=h,json={'mode':'sensitivity','section':'incomes','row_index':49}).status_code==422
    assert client.post(url,headers=h,json={'mode':'sensitivity','section':'savings','row_index':0}).status_code==422
    assert client.post(f'/api/checkups/{ck}/complete',headers=h).status_code==200
    assert client.post(url,headers=h,json=body).status_code==200
    with app.state.db.session() as session:
        from plan_api.repo import Repo
        Repo(session)._exec("UPDATE reports SET payload_json = :p WHERE checkup_id = :c",p='{"rules_version":"unsupported"}',c=ck)
    assert client.post(url,headers=h,json=body).status_code==409


def test_insights_are_saved_with_final_report_and_old_final_still_opens(client, app):
    h=login(client,'insights@example.com');ck=seed(client,h)
    draft=client.get(f'/api/checkups/{ck}/report',headers=h).json()
    assert draft['insights']['cash_plan']['mode']=='surplus'
    final=client.post(f'/api/checkups/{ck}/complete',headers=h).json()
    assert final['insights']==draft['insights']
    assert client.get(f'/api/checkups/{ck}/report',headers=h).json()['insights']==final['insights']
    legacy={k:v for k,v in final.items() if k!='insights'}
    import json
    with app.state.db.session() as session:
        from plan_api.repo import Repo
        Repo(session)._exec("UPDATE reports SET payload_json = :p WHERE checkup_id = :c",p=json.dumps(legacy),c=ck)
    old=client.get(f'/api/checkups/{ck}/report',headers=h)
    assert old.status_code==200 and 'insights' not in old.json()
