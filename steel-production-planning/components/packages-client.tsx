"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PackageStatusBadge } from "@/components/package-status-badge";
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
import { useCreatedPackages } from "@/lib/use-created-packages";
import { PACKAGE_STATUSES, type PackageInstance, type PackageStatus } from "@/lib/types";

const ALL = "__all__";
const PAGE_SIZE = 25;

export function PackagesClient({ packages }: { packages: PackageInstance[] }) {
  const [created] = useCreatedPackages();
  const all = useMemo(() => [...created, ...packages], [created, packages]);

  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>(ALL);
  const [page, setPage] = useState(0);

  const filtered = useMemo(
    () =>
      all
        .filter((p) => (status === ALL ? true : p.status === status))
        .filter((p) =>
          search
            ? p.project.toLowerCase().includes(search.toLowerCase()) || p.job.toLowerCase().includes(search.toLowerCase())
            : true
        ),
    [all, status, search]
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const visible = filtered.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Packages</h1>
        <p className="text-sm text-muted-foreground">{all.length} production packages across all projects.</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative sm:w-72">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search project or job…"
            className="pl-8"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
          />
        </div>
        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v ?? ALL);
            setPage(0);
          }}
        >
          <SelectTrigger className="sm:w-52">
            <SelectValue>{() => (status === ALL ? "All statuses" : status)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All statuses</SelectItem>
            {PACKAGE_STATUSES.map((s: PackageStatus) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead>Project</TableHead>
              <TableHead className="hidden sm:table-cell">Job / Phase / Release</TableHead>
              <TableHead className="hidden md:table-cell">Package type</TableHead>
              <TableHead className="hidden lg:table-cell">Planner</TableHead>
              <TableHead className="hidden md:table-cell">Required by</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((p) => {
              const openExceptions = p.requirements.filter((r) => r.status !== "Populated").length;
              return (
                <TableRow key={p.id} className="cursor-pointer" onClick={() => router.push(`/packages/${p.id}`)}>
                  <TableCell className="font-medium">{p.project}</TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                    {p.job} · {p.phase.replace(/^Phase \d+ — /, "")} · {p.release}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">{p.packageType}</TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">{p.planner}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">{p.requiredByDate}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <PackageStatusBadge status={p.status} />
                      {openExceptions > 0 ? (
                        <span className="text-xs text-muted-foreground">{openExceptions} open</span>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {visible.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                  No packages match these filters.
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
