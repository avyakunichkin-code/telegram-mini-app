import test from 'node:test';
import assert from 'node:assert/strict';
import { isSurveyStepComplete, shouldOfferPlaytestSurvey, surveyQuestionsForVersion } from './playtestSurvey.js';
test('grouped steps validate their own questions including false, not truthiness', () => {
  assert.equal(isSurveyStepComplete(0, {salary:'yes'}), false);
  assert.equal(isSurveyStepComplete(0, {salary:'yes', safety:'partly'}), false);
  assert.equal(isSurveyStepComplete(0, {salary:'yes', safety:'partly', safety_transfer:'yes', expense_buffer:'no'}), true);
  assert.equal(isSurveyStepComplete(1, {close:'yes', close_result:'partly', blocked:false}), true);
  assert.equal(isSurveyStepComplete(1, {close:'yes', close_result:'yes', blocked:'false'}), false);
  assert.equal(isSurveyStepComplete(2, {continue_playing:'unsure', difficulty:'normal'}), true);
  assert.equal(isSurveyStepComplete(2, {continue_playing:'yes', difficulty:'partly'}), false);
  assert.equal(isSurveyStepComplete(3, {}),false); // No fourth step.
  assert.equal(surveyQuestionsForVersion('first_turns_v1').length,5);
  assert.equal(surveyQuestionsForVersion('first_turns_v2').length,9);
  assert.equal(surveyQuestionsForVersion('unknown').length,0);
});
test('server eligibility never bypasses overlays, pending events, menu, or session dismissal', () => {
  const input={survey:{should_offer:true, can_submit:true}, activeTab:'dashboard', blocked:false,pendingEvents:0,sessionShown:false};
  assert.equal(shouldOfferPlaytestSurvey(input),true);
  for(const change of [{blocked:true},{pendingEvents:2},{activeTab:'menu'},{sessionShown:true},{survey:null},{survey:{should_offer:false,can_submit:true}},{survey:{should_offer:true,can_submit:false}}])assert.equal(shouldOfferPlaytestSurvey({...input,...change}),false);
});
