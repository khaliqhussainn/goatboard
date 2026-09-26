import { NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/admin-auth";
import {
  createGetListedReportResponse,
  getListedReportFormat,
} from "@/lib/get-listed-report";
import { getAdminGetListedReport } from "@/lib/queries/get-listed";

/** Admin download of the same buyer-safe campaign snapshot. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const format = getListedReportFormat(request);
  if (!format) {
    return NextResponse.json({ message: "Format must be csv or pdf." }, { status: 400 });
  }

  const { id } = await params;
  const report = await getAdminGetListedReport(id);
  if (!report) {
    return NextResponse.json({ message: "Campaign not found." }, { status: 404 });
  }

  return createGetListedReportResponse(report, format);
}
