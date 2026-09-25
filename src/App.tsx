import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { supabase } from "./lib/supabase";
import "./App.css";

type Theme = "sunset" | "ocean" | "forest" | "lavender";
type Goal = {
  id: string;
  name: string;
  theme: Theme;
  target: number;
  saved: number;
  cadence: "week" | "month";
  amount: number;
  createdAt: string;
};
type Deposit = {
  id: string;
  goalId: string;
  amount: number;
  createdAt: string;
};

const starterGoal: Goal = {
  id: "starter-trip",
  name: "Weekend in Kyoto",
  theme: "sunset",
  target: 1800,
  saved: 640,
  cadence: "week",
  amount: 120,
  createdAt: new Date().toISOString(),
};
const themeLabels: Record<Theme, string> = {
  sunset: "Sunset",
  ocean: "Ocean",
  forest: "Forest",
  lavender: "Lavender",
};
const formatMoney = (value: number) =>
  `$${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

const readGoals = async (): Promise<Goal[]> => {
  const { data, error } = await supabase
    .from("goals")
    .select("id, name, theme, target, saved, cadence, amount, created_at")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((goal) => ({
    id: goal.id,
    name: goal.name,
    theme: goal.theme as Theme,
    target: Number(goal.target),
    saved: Number(goal.saved),
    cadence: goal.cadence as Goal["cadence"],
    amount: Number(goal.amount),
    createdAt: goal.created_at,
  }));
};
const insertGoal = async (goal: Goal) => {
  const { error } = await supabase.from("goals").insert({
    id: goal.id,
    name: goal.name,
    theme: goal.theme,
    target: goal.target,
    saved: goal.saved,
    cadence: goal.cadence,
    amount: goal.amount,
    created_at: goal.createdAt,
  });
  if (error) throw error;
};
const updateGoal = async (goal: Goal) => {
  const { error } = await supabase
    .from("goals")
    .update({ saved: goal.saved })
    .eq("id", goal.id);
  if (error) throw error;
};
const insertDeposit = async (deposit: Deposit) => {
  const { error } = await supabase.from("deposits").insert({
    id: deposit.id,
    goal_id: deposit.goalId,
    amount: deposit.amount,
    created_at: deposit.createdAt,
  });
  if (error) throw error;
};

function App() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [deposit, setDeposit] = useState("");
  const [showNewGoal, setShowNewGoal] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingGoal, setSavingGoal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    name: "",
    target: "",
    cadence: "week" as Goal["cadence"],
    amount: "",
    theme: "sunset" as Theme,
  });

  useEffect(() => {
    readGoals()
      .then(async (savedGoals) => {
        if (!savedGoals.length) {
          await insertGoal(starterGoal);
          savedGoals = [starterGoal];
        }
        setGoals(savedGoals);
        setSelectedId(savedGoals[0].id);
      })
      .catch((error: Error) =>
        setMessage(`Supabase connection error: ${error.message}`),
      )
      .finally(() => setLoading(false));
  }, []);
  const selectedGoal = goals.find((goal) => goal.id === selectedId) ?? goals[0];
  const totalSaved = goals.reduce((total, goal) => total + goal.saved, 0);
  const totalTarget = goals.reduce((total, goal) => total + goal.target, 0);
  const percent = selectedGoal
    ? Math.min(
        100,
        Math.round((selectedGoal.saved / selectedGoal.target) * 100),
      )
    : 0;
  const remaining = selectedGoal
    ? Math.max(0, selectedGoal.target - selectedGoal.saved)
    : 0;
  const depositsToGo = selectedGoal
    ? Math.ceil(remaining / selectedGoal.amount)
    : 0;

  const handleDeposit = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedGoal || Number(deposit) <= 0) return;
    const amount = Number(deposit);
    const updatedGoal = {
      ...selectedGoal,
      saved: Math.min(selectedGoal.target, selectedGoal.saved + amount),
    };
    await updateGoal(updatedGoal);
    await insertDeposit({
      id: crypto.randomUUID(),
      goalId: selectedGoal.id,
      amount,
      createdAt: new Date().toISOString(),
    });
    setGoals(
      goals.map((goal) => (goal.id === updatedGoal.id ? updatedGoal : goal)),
    );
    setDeposit("");
    setMessage(`${formatMoney(amount)} added to your jar`);
    window.setTimeout(() => setMessage(""), 2600);
  };
  const handleCreateGoal = async (event: FormEvent) => {
    event.preventDefault();
    if (
      !newGoal.name ||
      Number(newGoal.target) <= 0 ||
      Number(newGoal.amount) <= 0
    ) {
      setMessage("Add a goal name, target, and deposit amount.");
      return;
    }
    const goal: Goal = {
      id: crypto.randomUUID(),
      name: newGoal.name,
      theme: newGoal.theme,
      target: Number(newGoal.target),
      saved: 0,
      cadence: newGoal.cadence,
      amount: Number(newGoal.amount),
      createdAt: new Date().toISOString(),
    };
    setSavingGoal(true);
    try {
      await insertGoal(goal);
      setGoals([...goals, goal]);
      setSelectedId(goal.id);
      setShowNewGoal(false);
      setNewGoal({
        name: "",
        target: "",
        cadence: "week",
        amount: "",
        theme: "sunset",
      });
      setMessage(`${goal.name} goal created`);
    } catch (error) {
      setMessage(
        `Could not create goal: ${error instanceof Error ? error.message : "Supabase request failed"}`,
      );
    } finally {
      setSavingGoal(false);
    }
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-mark">
          n<span>•</span>nest
        </div>
        <button className="icon-button" aria-label="Open notifications">
          ♧
        </button>
      </header>
      <section className="welcome-row">
        <div>
          <p className="eyebrow">Friday, September 25</p>
          <h1>
            Make room for
            <br />
            <em>what matters.</em>
          </h1>
        </div>
        <div className="avatar">AL</div>
      </section>
      <section className="overview">
        <div>
          <span>Total saved</span>
          <strong>{formatMoney(totalSaved)}</strong>
        </div>
        <div>
          <span>Across goals</span>
          <strong>{goals.length}</strong>
        </div>
        <div>
          <span>Overall progress</span>
          <strong>
            {totalTarget ? Math.round((totalSaved / totalTarget) * 100) : 0}%
          </strong>
        </div>
      </section>
      <div className="section-heading">
        <div>
          <p className="eyebrow">Your collection</p>
          <h2>Saving goals</h2>
        </div>
        <button
          className="add-button"
          onClick={() => setShowNewGoal(true)}
          aria-label="Add a new goal"
        >
          ＋
        </button>
      </div>
      {loading && <p className="loading-state">Loading your goals...</p>}
      <div className="goal-tabs" role="tablist" aria-label="Saving goals">
        {goals.map((goal) => (
          <button
            key={goal.id}
            className={goal.id === selectedGoal?.id ? "active" : ""}
            onClick={() => setSelectedId(goal.id)}
          >
            {goal.name}
          </button>
        ))}
      </div>
      {selectedGoal && (
        <section className={`jar-card theme-${selectedGoal.theme}`}>
          <div className="jar-card-head">
            <div>
              <span className="theme-label">
                {themeLabels[selectedGoal.theme]} goal
              </span>
              <h2>{selectedGoal.name}</h2>
            </div>
            <span className="percent">{percent}%</span>
          </div>
          <div className="jar-wrap">
            <div className="jar-glow" />
            <div className="jar">
              <div className="jar-lid" />
              <div
                className="jar-fill"
                style={{ height: `${Math.max(6, percent)}%` }}
              >
                <span className="shine" />
              </div>
              <div className="jar-label">
                {formatMoney(selectedGoal.saved)}
                <small>of {formatMoney(selectedGoal.target)}</small>
              </div>
            </div>
          </div>
          <div className="jar-stats">
            <div>
              <span>Left to go</span>
              <strong>{formatMoney(remaining)}</strong>
            </div>
            <div>
              <span>Every {selectedGoal.cadence}</span>
              <strong>{formatMoney(selectedGoal.amount)}</strong>
            </div>
            <div>
              <span>Deposits to go</span>
              <strong>{depositsToGo}</strong>
            </div>
          </div>
        </section>
      )}
      <form className="deposit-form" onSubmit={handleDeposit}>
        <div className="money-input">
          <span>$</span>
          <input
            inputMode="decimal"
            placeholder="0"
            aria-label="Deposit amount"
            value={deposit}
            onChange={(event) => setDeposit(event.target.value)}
          />
        </div>
        <button type="submit">
          Add to jar <span>↗</span>
        </button>
      </form>
      {message && (
        <p className="toast" role="status">
          {message}
        </p>
      )}
      <section className="next-up">
        <div>
          <p className="eyebrow">Your rhythm</p>
          <h2>Keep the momentum</h2>
        </div>
        <span className="streak">✦ 4 weeks</span>
        <p className="next-copy">
          You are on track for your next{" "}
          {formatMoney(selectedGoal?.amount ?? 0)} deposit this{" "}
          {selectedGoal?.cadence}.
        </p>
      </section>
      {showNewGoal && (
        <div className="modal-backdrop" onClick={() => setShowNewGoal(false)}>
          <form
            className="modal"
            onSubmit={handleCreateGoal}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-head">
              <div>
                <p className="eyebrow">New intention</p>
                <h2>What are you saving for?</h2>
              </div>
              <button
                type="button"
                className="close-button"
                onClick={() => setShowNewGoal(false)}
              >
                ×
              </button>
            </div>
            <label>
              Goal name
              <input
                autoFocus
                value={newGoal.name}
                placeholder="e.g. New camera"
                onChange={(event) =>
                  setNewGoal({ ...newGoal, name: event.target.value })
                }
              />
            </label>
            <div className="form-row">
              <label>
                Target amount
                <input
                  type="number"
                  min="1"
                  value={newGoal.target}
                  placeholder="1800"
                  onChange={(event) =>
                    setNewGoal({ ...newGoal, target: event.target.value })
                  }
                />
              </label>
              <label>
                Deposit amount
                <input
                  type="number"
                  min="1"
                  value={newGoal.amount}
                  placeholder="120"
                  onChange={(event) =>
                    setNewGoal({ ...newGoal, amount: event.target.value })
                  }
                />
              </label>
            </div>
            <label>
              Save every
              <select
                value={newGoal.cadence}
                onChange={(event) =>
                  setNewGoal({
                    ...newGoal,
                    cadence: event.target.value as Goal["cadence"],
                  })
                }
              >
                <option value="week">Week</option>
                <option value="month">Month</option>
              </select>
            </label>
            <fieldset>
              <legend>Choose a mood</legend>
              <div className="theme-picker">
                {(Object.keys(themeLabels) as Theme[]).map((theme) => (
                  <button
                    type="button"
                    key={theme}
                    className={`swatch swatch-${theme} ${newGoal.theme === theme ? "selected" : ""}`}
                    onClick={() => setNewGoal({ ...newGoal, theme })}
                  >
                    {themeLabels[theme]}
                  </button>
                ))}
              </div>
            </fieldset>
            <button
              className="primary-button"
              type="submit"
              disabled={savingGoal}
            >
              {savingGoal ? "Saving..." : "Create goal"}{" "}
              {!savingGoal && <span>↗</span>}
            </button>
            {message && (
              <p className="form-message" role="alert">
                {message}
              </p>
            )}
          </form>
        </div>
      )}
    </main>
  );
}

export default App;
