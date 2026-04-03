import type { CSSProperties } from 'react';

/** خلفية الـ tooltip — النص الافتراضي في Recharts للقيمة أسود (#000) في itemStyle */
export const chartTooltipContentStyle: CSSProperties = {
  background: '#1e293b',
  border: '1px solid #046A38',
  borderRadius: 8,
  color: '#f8fafc',
  fontSize: 13,
};

export const chartTooltipLabelStyle: CSSProperties = {
  color: '#ffffff',
  fontWeight: 700,
  fontSize: 15,
  marginBottom: 2,
};

export const chartTooltipItemStyle: CSSProperties = {
  display: 'block',
  color: '#ffffff',
  fontWeight: 800,
  fontSize: 17,
  paddingTop: 4,
  paddingBottom: 4,
};
