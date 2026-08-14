import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  listClasses,
  listEnrollments,
  listPayments,
  listStudents,
} from "../api";
import { Alert } from "../components/Alert";
import type {
  ClassEntity,
  Enrollment,
  Payment,
  StudentProfile,
} from "../types";
import { formatMoney } from "../utils/format";

export default function Dashboard() {
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [classes, setClasses] = useState<ClassEntity[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.allSettled([
      listStudents(),
      listEnrollments(),
      listClasses(),
      listPayments(),
    ]).then(
      ([studentsResult, enrollmentsResult, classesResult, paymentsResult]) => {
        if (!active) return;
        if (studentsResult.status === "fulfilled")
          setStudents(studentsResult.value.data);
        if (enrollmentsResult.status === "fulfilled")
          setEnrollments(enrollmentsResult.value.data);
        if (classesResult.status === "fulfilled")
          setClasses(classesResult.value.data);
        if (paymentsResult.status === "fulfilled")
          setPayments(paymentsResult.value.data);

        const failed = [
          studentsResult,
          enrollmentsResult,
          classesResult,
          paymentsResult,
        ].some((result) => result.status === "rejected");
        if (failed) {
          setError(
            "Alguns indicadores não puderam ser carregados. Atualize a página.",
          );
        }
      },
    );
    return () => {
      active = false;
    };
  }, []);

  const pendingEnrollments = enrollments.filter(
    (item) => item.status === "PENDING",
  ).length;
  const pendingPayments = payments.filter(
    (item) => item.status === "PENDING",
  ).length;
  const overduePayments = payments.filter(
    (item) => item.status === "OVERDUE",
  ).length;
  const revenue = payments
    .filter((item) => item.status === "PAID")
    .reduce((total, item) => total + Number(item.amount), 0);

  const cards = [
    {
      label: "Alunos cadastrados",
      value: String(students.length),
      to: "/students",
    },
    {
      label: "Matrículas pendentes",
      value: String(pendingEnrollments),
      to: "/enrollments",
    },
    { label: "Turmas ativas", value: String(classes.length), to: "/classes" },
    {
      label: "Mensalidades pendentes",
      value: String(pendingPayments),
      to: "/payments",
    },
    {
      label: "Mensalidades vencidas",
      value: String(overduePayments),
      to: "/payments",
    },
    { label: "Recebido", value: formatMoney(revenue), to: "/payments" },
  ];

  return (
    <div>
      <div className="page-head">
        <div>
          <p className="eyebrow">Visão geral</p>
          <h1>Dashboard</h1>
        </div>
      </div>

      {error && <Alert onDismiss={() => setError("")}>{error}</Alert>}

      <div className="cards">
        {cards.map((card) => (
          <Link key={card.label} className="stat-card" to={card.to}>
            <strong>{card.value}</strong>
            <span>{card.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
