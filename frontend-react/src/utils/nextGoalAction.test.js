import test from 'node:test';
import assert from 'node:assert/strict';
import { nextGoalAction } from '../components/mqx/utils/nextGoalAction.js';
const goal = {type:'safety_fund_months', detail:{target:1080000,current:900000}};
test('reserves expenses and caps the proposed contribution by the remaining goal', () => {
  assert.deepEqual(nextGoalAction(goal,260000,180000),{remaining:180000,current:900000,target:1080000,amount:80000,after:180000,kind:'safety'});
  assert.equal(nextGoalAction(goal,500000,180000).amount,180000);
  assert.equal(nextGoalAction(goal,100000,180000).amount,0);
});
test('missing targets and unavailable or completed goals never offer an action', () => {
  for (const value of [null,{...goal,met:true},{...goal,available:false},{type:'action_once'}, {...goal,detail:{}}]) assert.equal(nextGoalAction(value,100000,0),null);
});

