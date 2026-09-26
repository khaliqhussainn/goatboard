import { NextResponse } from "next/server";
import {
  createGetListedReportResponse,
  getListedReportFormat,
} from "@/lib/get-listed-report";
import { getSharedGetListedReport } from "@/lib/queries/get-listed";

/** Token-protected download for a read-only shared live report. */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const format = getListedReportFormat(request);
  if (!format) {
    return NextResponse.json({ message: "Format must be csv or pdf." }, { status: 400 });
  }

  const { token } = await params;
  const report = await getSharedGetListedReport(token);
  if (!report) {
    return NextResponse.json({ message: "Report not found." }, { status: 404 });
  }

  const response = await createGetListedReportResponse(report, format);
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
