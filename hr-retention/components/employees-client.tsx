"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Info, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RiskTierBadge } from "@/components/risk-tier-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { DEPARTMENTS, LOCATIONS, RISK_TIERS, type Employee } from "@/lib/types";

const PAGE_SIZE = 25;
const ALL = "__all__";

export function EmployeesClient({
  employees,
  initialFilters,
}: {
  employees: Employee[];
  initialFilters: { department?: string; location?: string; jobRole?: string };
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState(initialFilters.department ?? ALL);
  const [location, setLocation] = useState(initialFilters.location ?? ALL);
  const [tier, setTier] = useState<string>(ALL);
  const [page, setPage] = useState(0);

  const jobRoles = useMemo(() => Array.from(new Set(employees.map((e) => e.jobRole))).sort(), [employees]);
  const [jobRole, setJobRole] = useState(initialFilters.jobRole ?? ALL);

  const filtered = useMemo(() => {
    return employees
      .filter((e) => (department === ALL ? true : e.department === department))
      .filter((e) => (location === ALL ? true : e.location === location))
      .filter((e) => (jobRole === ALL ? true : e.jobRole === jobRole))
      .filter((e) => (tier === ALL ? true : e.riskTier === tier))
      .filter((e) => (search ? e.name.toLowerCase().includes(search.toLowerCase()) : true))
      .sort((a, b) => b.riskScore - a.riskScore);
  }, [employees, department, location, jobRole, tier, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const visible = filtered.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE);

  function resetPage() {
    setPage(0);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Employee explorer</h1>
        <p className="text-sm text-muted-foreground">Individual-level detail, for exploration only.</p>
      </div>

      <Card className="border-info/30 bg-info/5 py-3">
        <CardContent className="flex items-start gap-2.5 px-4 text-sm text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0 text-info" />
          This is a secondary, exploratory view distinct from the primary group-level dashboard. Retention
          recommendations are only ever generated for groups, never for a named individual.
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative sm:w-64">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name…"
            className="pl-8"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              resetPage();
            }}
          />
        </div>
        <Select
          value={department}
          onValueChange={(v) => {
            setDepartment(v ?? ALL);
            resetPage();
          }}
        >
          <SelectTrigger className="sm:w-48">
            <SelectValue>{() => (department === ALL ? "All departments" : department)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All departments</SelectItem>
            {DEPARTMENTS.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={location}
          onValueChange={(v) => {
            setLocation(v ?? ALL);
            resetPage();
          }}
        >
          <SelectTrigger className="sm:w-44">
            <SelectValue>{() => (location === ALL ? "All locations" : location)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All locations</SelectItem>
            {LOCATIONS.map((l) => (
              <SelectItem key={l} value={l}>
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={jobRole}
          onValueChange={(v) => {
            setJobRole(v ?? ALL);
            resetPage();
          }}
        >
          <SelectTrigger className="sm:w-48">
            <SelectValue>{() => (jobRole === ALL ? "All job roles" : jobRole)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All job roles</SelectItem>
            {jobRoles.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={tier}
          onValueChange={(v) => {
            setTier(v ?? ALL);
            resetPage();
          }}
        >
          <SelectTrigger className="sm:w-40">
            <SelectValue>{() => (tier === ALL ? "All tiers" : tier)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All tiers</SelectItem>
            {RISK_TIERS.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead>Name</TableHead>
              <TableHead className="hidden md:table-cell">Department</TableHead>
              <TableHead className="hidden lg:table-cell">Location</TableHead>
              <TableHead className="hidden sm:table-cell">Job role</TableHead>
              <TableHead className="hidden md:table-cell text-right">Tenure</TableHead>
              <TableHead>Risk</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((e) => (
              <TableRow key={e.id} className="cursor-pointer" onClick={() => router.push(`/employees/${e.id}`)}>
                <TableCell className="font-medium">{e.name}</TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">{e.department}</TableCell>
                <TableCell className="hidden lg:table-cell text-muted-foreground">{e.location}</TableCell>
                <TableCell className="hidden sm:table-cell text-muted-foreground">{e.jobRole}</TableCell>
                <TableCell className="hidden md:table-cell text-right tabular-nums text-muted-foreground">
                  {e.tenureMonths}mo
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="tabular-nums font-semibold">{e.riskScore}</span>
                    <RiskTierBadge tier={e.riskTier} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {visible.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                  No employees match these filters.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing {filtered.length === 0 ? 0 : currentPage * PAGE_SIZE + 1}–
          {Math.min(filtered.length, (currentPage + 1) * PAGE_SIZE)} of {filtered.length}
        </span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={currentPage === 0} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= pageCount - 1}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
