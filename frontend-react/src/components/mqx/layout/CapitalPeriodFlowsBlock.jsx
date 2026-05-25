import { useEffect, useMemo, useState } from 'react';
import { MoneyText } from '../../MoneyText';
import { buildCapitalPeriodFlows } from '../../../utils/buildCapitalPeriodFlows';
import { MqxCapitalSectionAccordion } from './MqxCapitalSectionAccordion';

function FlowLines({ article, tone }) {
  if (!article?.items?.length) return null;

  return (
    <div className="mqx-cap-flow-lines">
      {article.items.map((item) => {
        if (article.byType && Array.isArray(item.items)) {
          return (
            <div key={item.key || item.label} className="mqx-cap-flow-group">
              <div className="mqx-cap-flow-line mqx-cap-flow-line--type">
                <span>{item.label}</span>
                <MoneyText
                  value={item.amount}
                  decimals={0}
                  className={`mqx-cap-flow-amt mqx-cap-flow-amt--${tone}`}
                />
              </div>
              {item.items.map((sub) => (
                <div key={sub.id || sub.title} className="mqx-cap-flow-line">
                  <span>{sub.title}</span>
                  <MoneyText value={sub.amount} decimals={0} />
                </div>
              ))}
            </div>
          );
        }

        return (
          <div key={item.id || item.title || item.label} className="mqx-cap-flow-line">
            <span>{item.title || item.label}</span>
            <MoneyText value={item.amount} decimals={0} />
          </div>
        );
      })}
    </div>
  );
}

function FlowSide({ side, tone, title, open, sectionId }) {
  const articles = side?.articles || [];
  const total = Number(side?.total) || 0;

  return (
    <MqxCapitalSectionAccordion
      title={title}
      meta={<MoneyText value={total} decimals={0} />}
      tone={tone}
      open={open}
      sectionId={sectionId}
    >
      {articles.map((article) => (
        <div key={article.key} className="mqx-cap-flow-cat">
          <div className="mqx-cap-flow-cat__row">
            <span>{article.label}</span>
            <MoneyText
              value={article.amount}
              decimals={0}
              className={`mqx-cap-flow-amt mqx-cap-flow-amt--${tone}`}
            />
          </div>
          <FlowLines article={article} tone={tone} />
        </div>
      ))}
    </MqxCapitalSectionAccordion>
  );
}

/** @param {{ overview: object, investPositions?: object[], policies?: object[], openFlowsSection?: 'income'|'expense'|null }} props */
export function CapitalPeriodFlowsBlock({
  overview,
  investPositions = [],
  policies = [],
  openFlowsSection = null,
}) {
  const flows = useMemo(
    () => buildCapitalPeriodFlows({ overview, investPositions, policies }),
    [overview, investPositions, policies],
  );

  if (!overview) return null;

  const [expandedSection, setExpandedSection] = useState(null);

  useEffect(() => {
    if (openFlowsSection === 'income' || openFlowsSection === 'expense') {
      setExpandedSection(openFlowsSection);
    }
  }, [openFlowsSection]);

  const incomeOpen = expandedSection === 'income';
  const expenseOpen = expandedSection === 'expense';

  return (
    <>
      <FlowSide
        side={flows.income}
        tone="in"
        title="Доходы"
        open={incomeOpen}
        sectionId="capital-flows-income"
      />
      <FlowSide
        side={flows.expense}
        tone="out"
        title="Расходы"
        open={expenseOpen}
        sectionId="capital-flows-expense"
      />
    </>
  );
}
