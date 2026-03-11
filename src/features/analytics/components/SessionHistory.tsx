import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingDown, Calendar } from 'lucide-react';
import { QuizResponse } from '../../quiz/types';

interface SessionHistoryProps {
  responses: QuizResponse[];
}

interface SessionRecord {
  session: number;
  date: string;
  items: number;
  accuracy: number;
  avgConfidence: number;
  ece: number;
}

/** Bin a set of responses into confidence bins and compute ECE */
function computeECE(responses: QuizResponse[], numBins = 5): number {
  const bins: { correct: number; total: number; confSum: number }[] = [];
  for (let i = 0; i < numBins; i++) bins.push({ correct: 0, total: 0, confSum: 0 });

  for (const r of responses) {
    const idx = Math.min(Math.floor((r.confidence / 100) * numBins), numBins - 1);
    bins[idx].total += 1;
    bins[idx].confSum += r.confidence / 100;
    if (r.correctness) bins[idx].correct += 1;
  }

  let ece = 0;
  const n = responses.length;
  for (const b of bins) {
    if (b.total === 0) continue;
    ece += (b.total / n) * Math.abs(b.correct / b.total - b.confSum / b.total);
  }
  return ece;
}

/** Split responses into sessions (groups separated by >10 min gaps) */
function splitIntoSessions(responses: QuizResponse[]): QuizResponse[][] {
  if (responses.length === 0) return [];

  const sorted = [...responses].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
  );

  const sessions: QuizResponse[][] = [[sorted[0]]];
  for (let i = 1; i < sorted.length; i++) {
    const gap = sorted[i].timestamp.getTime() - sorted[i - 1].timestamp.getTime();
    if (gap > 10 * 60 * 1000) {
      // >10 minutes gap = new session
      sessions.push([sorted[i]]);
    } else {
      sessions[sessions.length - 1].push(sorted[i]);
    }
  }

  return sessions;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload?.[0]) {
    const d = payload[0].payload as SessionRecord;
    return (
      <div className="chart-tooltip">
        <p><strong>Session {d.session}</strong> ({d.date})</p>
        <p>ECE: {(d.ece * 100).toFixed(1)}%</p>
        <p>Accuracy: {(d.accuracy * 100).toFixed(0)}%</p>
        <p>Avg Confidence: {(d.avgConfidence * 100).toFixed(0)}%</p>
        <p>Items: {d.items}</p>
      </div>
    );
  }
  return null;
};

export default function SessionHistory({ responses }: SessionHistoryProps) {
  const sessionRecords = useMemo(() => {
    const sessions = splitIntoSessions(responses);
    return sessions.map((sess, i) => {
      const items = sess.length;
      const correct = sess.filter(r => r.correctness).length;
      const accuracy = items > 0 ? correct / items : 0;
      const avgConf = items > 0 ? sess.reduce((s, r) => s + r.confidence, 0) / items / 100 : 0;
      const ece = items >= 3 ? computeECE(sess) : 0;
      const date = sess[0].timestamp.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      return { session: i + 1, date, items, accuracy, avgConfidence: avgConf, ece } as SessionRecord;
    });
  }, [responses]);

  if (sessionRecords.length < 2) {
    return (
      <div className="session-history">
        <h4 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <TrendingDown size={18} />
          ECE Over Sessions
        </h4>
        <p className="analytics-empty" style={{ padding: '16px 0' }}>
          Complete at least 2 sessions to see your calibration trend.
        </p>
      </div>
    );
  }

  return (
    <div className="session-history">
      <h4 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <TrendingDown size={18} />
        Calibration Trend (ECE Over Sessions)
      </h4>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={sessionRecords} margin={{ top: 5, right: 20, bottom: 20, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="session"
            label={{ value: 'Session', position: 'bottom', offset: 0, fontSize: 12 }}
          />
          <YAxis
            domain={[0, 0.5]}
            tickFormatter={v => `${(v * 100).toFixed(0)}%`}
            label={{ value: 'ECE', angle: -90, position: 'insideLeft', fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="ece"
            stroke="#4F46E5"
            strokeWidth={2}
            dot={{ fill: '#4F46E5', r: 4, strokeWidth: 2, stroke: '#fff' }}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Session list */}
      <div style={{ marginTop: 16 }}>
        <h5 style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <Calendar size={14} />
          Session Log
        </h5>
        <div style={{ maxHeight: 200, overflowY: 'auto' }}>
          {sessionRecords.slice().reverse().map(s => (
            <div
              key={s.session}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '6px 0',
                borderBottom: '1px solid var(--border-light, #e2e8f0)',
                fontSize: '0.85rem',
              }}
            >
              <span>Session {s.session} ({s.date})</span>
              <span style={{ display: 'flex', gap: 12 }}>
                <span>{(s.accuracy * 100).toFixed(0)}% acc</span>
                <span style={{ fontWeight: 600 }}>ECE {(s.ece * 100).toFixed(1)}%</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
