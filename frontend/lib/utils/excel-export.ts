import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

/**
 * Excel Export Utility for Analytics Page
 * Exports comprehensive analytics data to a multi-sheet Excel workbook
 */

// ============= TYPES =============

interface ExportData {
    workspaceName: string;
    keyMetrics: {
        activeUsers: number;
        engagedSessions: number;
        keyEvents: number;
        aiOverviewClicks: number;
    };
    chartData: any[];
    aiModelsData: any[];
    aiLandingPageData: any[];
    scTopQueries: any[];
    scChartData: any[];
    searchConsoleData: any;
    aiOverviewStats: { pages: any[]; devices: any[] };
    firstTouchData: any[];
    zeroTouchData: any[];
    conversionRateData: any[];
    topicClusterData: any[];
    aiGrowthData: any[];
    aiDeviceData: any[];
    demographicsData: any[];
}

// ============= STYLING UTILITIES =============

const COLORS = {
    headerBg: 'FF1E293B', // slate-800
    headerText: 'FFFFFFFF', // white
    zebraStripe: 'FFF8FAFC', // slate-50
    border: 'FFE2E8F0', // slate-200
    successGreen: 'FF10B981',
    warningYellow: 'FFF59E0B',
    dangerRed: 'FFEF4444',
};

/**
 * Apply professional header styling to a row
 */
function styleHeader(row: ExcelJS.Row) {
    row.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: COLORS.headerText }, size: 11 };
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: COLORS.headerBg },
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = {
            top: { style: 'thin', color: { argb: COLORS.border } },
            left: { style: 'thin', color: { argb: COLORS.border } },
            bottom: { style: 'thick', color: { argb: COLORS.border } },
            right: { style: 'thin', color: { argb: COLORS.border } },
        };
    });
    row.height = 20;
}

/**
 * Apply zebra striping to data rows
 */
function applyZebraStriping(worksheet: ExcelJS.Worksheet, startRow: number, endRow: number) {
    for (let i = startRow; i <= endRow; i++) {
        const row = worksheet.getRow(i);
        if (i % 2 === 0) {
            row.eachCell((cell) => {
                if (!cell.fill || (cell.fill as any).fgColor?.argb !== COLORS.headerBg) {
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: COLORS.zebraStripe },
                    };
                }
            });
        }
        // Add borders to all cells
        row.eachCell((cell) => {
            cell.border = {
                top: { style: 'thin', color: { argb: COLORS.border } },
                left: { style: 'thin', color: { argb: COLORS.border } },
                bottom: { style: 'thin', color: { argb: COLORS.border } },
                right: { style: 'thin', color: { argb: COLORS.border } },
            };
        });
    }
}

/**
 * Auto-fit columns based on content
 */
function autoFitColumns(worksheet: ExcelJS.Worksheet) {
    worksheet.columns.forEach((column) => {
        if (!column || !column.eachCell) return;

        let maxLength = 10;
        column.eachCell({ includeEmpty: false }, (cell) => {
            const cellValue = cell.value?.toString() || '';
            maxLength = Math.max(maxLength, cellValue.length);
        });
        column.width = Math.min(maxLength + 2, 50); // Cap at 50
    });
}

/**
 * Format date to "MMM DD, YYYY"
 */
function formatDate(dateValue: any): string {
    if (!dateValue) return '';
    const dateStr = String(dateValue);

    // Handle YYYYMMDD format
    if (dateStr.length === 8 && !isNaN(Number(dateStr))) {
        const year = parseInt(dateStr.substring(0, 4));
        const month = parseInt(dateStr.substring(4, 6));
        const day = parseInt(dateStr.substring(6, 8));
        const date = new Date(year, month - 1, day);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    // Handle ISO date string
    const date = new Date(dateValue);
    if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    return dateStr;
}

// ============= DATA VALIDATION HELPERS =============

/**
 * Check if data array has meaningful values (not all N/A, null, 0, or empty)
 */
function hasValidData(data: any[]): boolean {
    if (!data || data.length === 0) return false;

    // Check if any row has non-zero, non-N/A values
    return data.some((row) => {
        // Check all numeric fields
        const numericValues = Object.values(row).filter((val) => typeof val === 'number');
        const hasNonZeroNumber = numericValues.some((val) => val !== 0);

        // Check string fields for non-N/A values
        const stringValues = Object.values(row).filter((val) => typeof val === 'string');
        const hasValidString = stringValues.some((val) =>
            val && val !== 'N/A' && val.trim() !== '' && val !== '(not set)'
        );

        return hasNonZeroNumber || hasValidString;
    });
}

/**
 * Check if topic cluster data has meaningful values
 */
function hasValidTopicData(data: any[]): boolean {
    if (!data || data.length === 0) return false;
    return data.some((row) =>
        (row.clicks && row.clicks > 0) ||
        (row.impressions && row.impressions > 0) ||
        (row.topic && row.topic !== 'N/A' && row.topic.trim() !== '')
    );
}

/**
 * Check if growth data has meaningful values
 */
function hasValidGrowthData(data: any[]): boolean {
    if (!data || data.length === 0) return false;
    return data.some((row) =>
        (row.traffic && row.traffic > 0) ||
        (row.month && row.month !== '' && row.month.trim() !== '')
    );
}

/**
 * Check if conversion data has meaningful values
 */
function hasValidConversionData(data: any[]): boolean {
    if (!data || data.length === 0) return false;
    return data.some((row) =>
        (row.conversions && row.conversions > 0) ||
        (row.date && row.date !== '')
    );
}

// ============= SHEET CREATORS =============

/**
 * Sheet 1: Overview - Executive Summary
 */
function createOverviewSheet(workbook: ExcelJS.Workbook, data: ExportData) {
    const sheet = workbook.addWorksheet('Overview');

    // Title
    sheet.mergeCells('A1:D1');
    sheet.getCell('A1').value = `Analytics Overview - ${data.workspaceName}`;
    sheet.getCell('A1').font = { bold: true, size: 14 };
    sheet.getCell('A1').alignment = { horizontal: 'center' };

    // Date
    sheet.mergeCells('A2:D2');
    sheet.getCell('A2').value = `Report Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`;
    sheet.getCell('A2').alignment = { horizontal: 'center' };
    sheet.getCell('A2').font = { size: 11, color: { argb: 'FF64748B' } };

    let currentRow = 4;

    // AI Models Summary
    sheet.mergeCells(`A${currentRow}:D${currentRow}`);
    sheet.getCell(`A${currentRow}`).value = 'AI MODELS SUMMARY';
    sheet.getCell(`A${currentRow}`).font = { bold: true, size: 12 };
    currentRow++;

    const totalAITraffic = data.aiModelsData.reduce((sum, model) => sum + (model.users || 0), 0);
    const topModel = data.aiModelsData.reduce((max, model) =>
        (model.users || 0) > (max.users || 0) ? model : max, data.aiModelsData[0] || { model: 'N/A', users: 0 });
    const topModelPercentage = totalAITraffic > 0 ? ((topModel.users / totalAITraffic) * 100).toFixed(1) : '0';

    sheet.getCell(`A${currentRow}`).value = 'Total AI Traffic';
    sheet.getCell(`B${currentRow}`).value = totalAITraffic;
    sheet.getCell(`B${currentRow}`).numFmt = '#,##0';
    sheet.getCell(`B${currentRow}`).alignment = { horizontal: 'right' };
    currentRow++;

    sheet.getCell(`A${currentRow}`).value = 'Top AI Model';
    sheet.getCell(`B${currentRow}`).value = `${topModel.model} (${topModelPercentage}%)`;
    sheet.getCell(`B${currentRow}`).alignment = { horizontal: 'right' };
    currentRow += 2;

    // Landing Pages Summary
    sheet.mergeCells(`A${currentRow}:D${currentRow}`);
    sheet.getCell(`A${currentRow}`).value = 'LANDING PAGES SUMMARY';
    sheet.getCell(`A${currentRow}`).font = { bold: true, size: 12 };
    currentRow++;

    const totalLandingPages = data.aiLandingPageData.length;
    const totalLandingUsers = data.aiLandingPageData.reduce((sum, page) => sum + (page.users || 0), 0);

    sheet.getCell(`A${currentRow}`).value = 'Total Landing Pages';
    sheet.getCell(`B${currentRow}`).value = totalLandingPages;
    sheet.getCell(`B${currentRow}`).numFmt = '#,##0';
    sheet.getCell(`B${currentRow}`).alignment = { horizontal: 'right' };
    currentRow++;

    sheet.getCell(`A${currentRow}`).value = 'Total AI Users';
    sheet.getCell(`B${currentRow}`).value = totalLandingUsers;
    sheet.getCell(`B${currentRow}`).numFmt = '#,##0';
    sheet.getCell(`B${currentRow}`).alignment = { horizontal: 'right' };

    sheet.getColumn('A').width = 30;
    sheet.getColumn('B').width = 20;
}

/**
 * Sheet 2: Website Traffic Trends
 */
function createTrafficTrendsSheet(workbook: ExcelJS.Workbook, data: ExportData) {
    const sheet = workbook.addWorksheet('Website Traffic Trends');

    // Headers
    const headers = ['Date', 'Total Users', 'AI Users', '% AI Traffic', 'Engaged Sessions'];
    sheet.addRow(headers);
    styleHeader(sheet.getRow(1));

    // Data rows
    data.chartData.forEach((row) => {
        const aiPercentage = row.users > 0 ? ((row.aiUsers / row.users) * 100).toFixed(1) : '0';
        sheet.addRow([
            formatDate(row.name),
            row.users || 0,
            row.aiUsers || 0,
            parseFloat(aiPercentage),
            row.engagedSessions || 0,
        ]);
    });

    // Total row
    const lastRow = sheet.lastRow?.number || 1;
    const totalRow = sheet.addRow([
        'TOTAL',
        { formula: `SUM(B2:B${lastRow})` },
        { formula: `SUM(C2:C${lastRow})` },
        { formula: `AVERAGE(D2:D${lastRow})` },
        { formula: `SUM(E2:E${lastRow})` },
    ]);
    totalRow.font = { bold: true };

    // Format columns
    sheet.getColumn('D').numFmt = '0.0"%"';
    sheet.getColumn('B').numFmt = '#,##0';
    sheet.getColumn('C').numFmt = '#,##0';
    sheet.getColumn('E').numFmt = '#,##0';

    // Freeze header
    sheet.views = [{ state: 'frozen', ySplit: 1 }];

    // Apply styling
    applyZebraStriping(sheet, 2, lastRow + 1);
    autoFitColumns(sheet);
}

/**
 * Sheet 3: AI Overview Performance
 */
function createAIOverviewStatsSheet(workbook: ExcelJS.Workbook, data: ExportData) {
    const sheet = workbook.addWorksheet('AI Overview Performance');

    let currentRow = 1;

    // Section 1: Top Pages by AI Overview Clicks
    sheet.mergeCells(`A${currentRow}:E${currentRow}`);
    sheet.getCell(`A${currentRow}`).value = 'Top Pages by AI Overview Clicks';
    sheet.getCell(`A${currentRow}`).font = { bold: true, size: 12 };
    sheet.getCell(`A${currentRow}`).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: COLORS.headerBg },
    };
    sheet.getCell(`A${currentRow}`).font.color = { argb: COLORS.headerText };
    currentRow++;

    const pageHeaders = ['Rank', 'Page Path', 'Clicks', 'Impressions', 'CTR'];
    sheet.addRow(pageHeaders);
    styleHeader(sheet.getRow(currentRow));
    currentRow++;

    data.aiOverviewStats.pages.forEach((page, index) => {
        const ctr = page.impressions > 0 ? ((page.clicks / page.impressions) * 100).toFixed(2) : '0';
        sheet.addRow([
            index + 1,
            page.pagePath || 'N/A',
            page.clicks || 0,
            page.impressions || 0,
            parseFloat(ctr),
        ]);
        currentRow++;
    });

    // Blank rows
    currentRow += 2;

    // Section 2: Device Breakdown
    sheet.mergeCells(`A${currentRow}:D${currentRow}`);
    sheet.getCell(`A${currentRow}`).value = 'Device Breakdown';
    sheet.getCell(`A${currentRow}`).font = { bold: true, size: 12 };
    sheet.getCell(`A${currentRow}`).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: COLORS.headerBg },
    };
    sheet.getCell(`A${currentRow}`).font.color = { argb: COLORS.headerText };
    currentRow++;

    const deviceHeaders = ['Device', 'Clicks', 'Impressions', '% Share'];
    sheet.addRow(deviceHeaders);
    styleHeader(sheet.getRow(currentRow));
    currentRow++;

    const deviceStartRow = currentRow;
    const totalDeviceClicks = data.aiOverviewStats.devices.reduce((sum, d) => sum + (d.clicks || 0), 0);

    data.aiOverviewStats.devices.forEach((device) => {
        const share = totalDeviceClicks > 0 ? ((device.clicks / totalDeviceClicks) * 100).toFixed(1) : '0';
        sheet.addRow([
            device.device || 'N/A',
            device.clicks || 0,
            device.impressions || 0,
            parseFloat(share),
        ]);
        currentRow++;
    });

    // Format columns
    sheet.getColumn('E').numFmt = '0.00"%"';
    sheet.getColumn('D').numFmt = '0.0"%"';
    sheet.getColumn('C').numFmt = '#,##0';

    applyZebraStriping(sheet, 3, currentRow);
    autoFitColumns(sheet);
}

/**
 * Sheet 4: First Touch Attribution
 */
function createFirstTouchSheet(workbook: ExcelJS.Workbook, data: ExportData) {
    const sheet = workbook.addWorksheet('First Touch Attribution');

    const headers = ['Date', 'New Users', 'Conversions', 'Conversion Rate'];
    sheet.addRow(headers);
    styleHeader(sheet.getRow(1));

    // Sort data by date in ascending order (oldest to newest)
    const sortedData = [...data.firstTouchData].sort((a, b) => {
        const dateA = String(a.date);
        const dateB = String(b.date);
        return dateA.localeCompare(dateB);
    });

    sortedData.forEach((row) => {
        const convRate = row.users > 0 ? ((row.conversions / row.users) * 100).toFixed(2) : '0';
        sheet.addRow([
            formatDate(row.date),
            row.users || 0,
            row.conversions || 0,
            parseFloat(convRate),
        ]);
    });

    // Summary row
    const lastRow = sheet.lastRow?.number || 1;
    const summaryRow = sheet.addRow([
        'TOTAL/AVERAGE',
        { formula: `SUM(B2:B${lastRow})` },
        { formula: `SUM(C2:C${lastRow})` },
        { formula: `AVERAGE(D2:D${lastRow})` },
    ]);
    summaryRow.font = { bold: true };

    sheet.getColumn('D').numFmt = '0.00"%"';
    sheet.getColumn('B').numFmt = '#,##0';
    sheet.getColumn('C').numFmt = '#,##0';

    sheet.views = [{ state: 'frozen', ySplit: 1 }];
    applyZebraStriping(sheet, 2, lastRow + 1);
    autoFitColumns(sheet);
}

/**
 * Sheet 5: Zero Touch Attribution
 */
function createZeroTouchSheet(workbook: ExcelJS.Workbook, data: ExportData) {
    const sheet = workbook.addWorksheet('Zero Touch Attribution');

    const headers = ['Date', 'Impressions', 'Brand Searches'];
    sheet.addRow(headers);
    styleHeader(sheet.getRow(1));

    data.zeroTouchData.forEach((row) => {
        sheet.addRow([
            formatDate(row.date),
            row.impressions || 0,
            row.brandSearches || 0,
        ]);
    });

    // Summary row
    const lastRow = sheet.lastRow?.number || 1;
    const summaryRow = sheet.addRow([
        'TOTAL',
        { formula: `SUM(B2:B${lastRow})` },
        { formula: `SUM(C2:C${lastRow})` },
    ]);
    summaryRow.font = { bold: true };

    sheet.getColumn('B').numFmt = '#,##0';
    sheet.getColumn('C').numFmt = '#,##0';

    sheet.views = [{ state: 'frozen', ySplit: 1 }];
    applyZebraStriping(sheet, 2, lastRow + 1);
    autoFitColumns(sheet);
}

/**
 * Sheet 6: AI Conversion Rate
 */
function createConversionRateSheet(workbook: ExcelJS.Workbook, data: ExportData) {
    const sheet = workbook.addWorksheet('AI Conversion Rate');

    const headers = ['Date', 'Conversions', 'Conversion Rate'];
    sheet.addRow(headers);
    styleHeader(sheet.getRow(1));

    data.conversionRateData.forEach((row) => {
        sheet.addRow([
            formatDate(row.date),
            row.conversions || 0,
            parseFloat(row.conversionRate?.toString().replace('%', '') || '0'),
        ]);
    });

    // Summary row
    const lastRow = sheet.lastRow?.number || 1;
    const summaryRow = sheet.addRow([
        'TOTAL/AVERAGE',
        { formula: `SUM(B2:B${lastRow})` },
        { formula: `AVERAGE(C2:C${lastRow})` },
    ]);
    summaryRow.font = { bold: true };

    sheet.getColumn('C').numFmt = '0.00"%"';
    sheet.getColumn('B').numFmt = '#,##0';

    // Conditional formatting for conversion rate
    sheet.addConditionalFormatting({
        ref: `C2:C${lastRow}`,
        rules: [
            {
                type: 'cellIs',
                operator: 'greaterThan',
                formulae: ['15'],
                style: {
                    fill: {
                        type: 'pattern',
                        pattern: 'solid',
                        bgColor: { argb: COLORS.successGreen },
                    },
                },
                priority: 1,
            },
            {
                type: 'cellIs',
                operator: 'between',
                formulae: ['10', '15'],
                style: {
                    fill: {
                        type: 'pattern',
                        pattern: 'solid',
                        bgColor: { argb: COLORS.warningYellow },
                    },
                },
                priority: 2,
            },
        ],
    });

    sheet.views = [{ state: 'frozen', ySplit: 1 }];
    applyZebraStriping(sheet, 2, lastRow + 1);
    autoFitColumns(sheet);
}

/**
 * Sheet 7: Topic Clusters
 */
function createTopicClustersSheet(workbook: ExcelJS.Workbook, data: ExportData) {
    const sheet = workbook.addWorksheet('Topic Clusters');

    const headers = ['Topic', 'Users', 'Impressions', 'Share %'];
    sheet.addRow(headers);
    styleHeader(sheet.getRow(1));

    const totalClicks = data.topicClusterData.reduce((sum, topic) => sum + (topic.size || 0), 0);

    // Sort by clicks descending
    const sortedData = [...data.topicClusterData].sort((a, b) => (b.size || 0) - (a.size || 0));

    sortedData.forEach((topic) => {
        const share = totalClicks > 0 ? ((topic.size / totalClicks) * 100).toFixed(1) : '0';
        sheet.addRow([
            topic.name || 'N/A',
            topic.size || 0,
            topic.impressions || 0,
            parseFloat(share),
        ]);
    });

    sheet.getColumn('D').numFmt = '0.0"%"';
    sheet.getColumn('B').numFmt = '#,##0';
    sheet.getColumn('C').numFmt = '#,##0';

    // Conditional formatting for share
    const lastRow = sheet.lastRow?.number || 1;
    sheet.addConditionalFormatting({
        ref: `B2:B${lastRow}`,
        rules: [
            {
                type: 'colorScale',
                cfvo: [
                    { type: 'min' },
                    { type: 'max' },
                ],
                color: [
                    { argb: 'FFFFFFFF' },
                    { argb: COLORS.successGreen },
                ],
                priority: 1,
            },
        ],
    });

    sheet.views = [{ state: 'frozen', ySplit: 1 }];
    applyZebraStriping(sheet, 2, lastRow);
    autoFitColumns(sheet);
}

/**
 * Sheet 8: AI Growth Rate (MoM)
 */
function createAIGrowthSheet(workbook: ExcelJS.Workbook, data: ExportData) {
    const sheet = workbook.addWorksheet('AI Growth Rate (MoM)');

    const headers = ['Month', 'AI Traffic', 'Growth Rate', 'Status'];
    sheet.addRow(headers);
    styleHeader(sheet.getRow(1));

    data.aiGrowthData.forEach((row) => {
        const growthRate = parseFloat(row.growth?.toString() || '0');
        const status = growthRate > 0 ? 'Growing' : 'Declining';
        sheet.addRow([
            row.date,
            row.value || 0,
            growthRate,
            status,
        ]);
    });

    sheet.getColumn('C').numFmt = '0.0"%"';
    sheet.getColumn('B').numFmt = '#,##0';

    // Conditional formatting for growth rate
    const lastRow = sheet.lastRow?.number || 1;
    sheet.addConditionalFormatting({
        ref: `C2:C${lastRow}`,
        rules: [
            {
                type: 'cellIs',
                operator: 'greaterThan',
                formulae: ['0'],
                style: {
                    font: { color: { argb: COLORS.successGreen }, bold: true },
                },
                priority: 1,
            },
            {
                type: 'cellIs',
                operator: 'lessThan',
                formulae: ['0'],
                style: {
                    font: { color: { argb: COLORS.dangerRed }, bold: true },
                },
                priority: 2,
            },
        ],
    });

    sheet.views = [{ state: 'frozen', ySplit: 1 }];
    applyZebraStriping(sheet, 2, lastRow);
    autoFitColumns(sheet);
}

/**
 * Sheet 9: AI Models Distribution
 */
function createAIModelsSheet(workbook: ExcelJS.Workbook, data: ExportData) {
    const sheet = workbook.addWorksheet('AI Models Performance');

    const headers = ['AI Model', 'Active Users', 'Sessions', 'Conversion Rate', '% of Total Traffic'];
    sheet.addRow(headers);
    styleHeader(sheet.getRow(1));

    const modelColors: Record<string, string> = {
        ChatGPT: 'FF10B981',
        Copilot: 'FF3B82F6',
        Perplexity: 'FF8B5CF6',
        Gemini: 'FFF97316',
        Claude: 'FF06B6D4',
    };

    const filteredModels = data.aiModelsData.filter((model) => model.users > 0);
    const totalUsers = filteredModels.reduce((sum, model) => sum + (model.users || 0), 0);

    filteredModels.forEach((model, index) => {
        const rowNum = index + 2;
        const convRate = parseFloat(model.conversionRate?.toString().replace('%', '') || '0');
        const trafficShare = totalUsers > 0 ? ((model.users / totalUsers) * 100).toFixed(1) : '0';

        sheet.addRow([
            model.model,
            model.users || 0,
            model.sessions || 0,
            convRate,
            parseFloat(trafficShare),
        ]);

        // Color-code row
        const color = modelColors[model.model] || 'FFFFFFFF';
        const row = sheet.getRow(rowNum);
        row.getCell(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: color },
        };
        row.getCell(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };
    });

    // Summary row
    const lastRow = sheet.lastRow?.number || 1;
    const summaryRow = sheet.addRow([
        'TOTAL',
        { formula: `SUM(B2:B${lastRow})` },
        { formula: `SUM(C2:C${lastRow})` },
        { formula: `AVERAGE(D2:D${lastRow})` },
        100,
    ]);
    summaryRow.font = { bold: true };

    sheet.getColumn('D').numFmt = '0.00"%"';
    sheet.getColumn('E').numFmt = '0.0"%"';
    sheet.getColumn('B').numFmt = '#,##0';
    sheet.getColumn('C').numFmt = '#,##0';

    sheet.views = [{ state: 'frozen', ySplit: 1 }];
    applyZebraStriping(sheet, 2, lastRow + 1);
    autoFitColumns(sheet);
}

/**
 * Sheet 10: AI Traffic Landing Pages
 */
function createLandingPagesSheet(workbook: ExcelJS.Workbook, data: ExportData) {
    const sheet = workbook.addWorksheet('AI Traffic Landing pages');

    const headers = ['Rank', 'Landing Page', 'Source', 'Users', '% Share'];
    sheet.addRow(headers);
    styleHeader(sheet.getRow(1));

    const totalUsers = data.aiLandingPageData.reduce((sum, page) => sum + (page.users || 0), 0);

    data.aiLandingPageData.forEach((page, index) => {
        const share = totalUsers > 0 ? ((page.users / totalUsers) * 100).toFixed(1) : '0';
        const rowNum = index + 2;

        sheet.addRow([
            index + 1,
            page.page === '(not set)' ? 'Homepage' : page.page,
            page.source || 'N/A',
            page.users || 0,
            parseFloat(share),
        ]);

        // Highlight top 3
        const row = sheet.getRow(rowNum);
        if (index === 0) {
            row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFD700' } }; // Gold
        } else if (index === 1) {
            row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC0C0C0' } }; // Silver
        } else if (index === 2) {
            row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCD7F32' } }; // Bronze
        }
    });

    sheet.getColumn('E').numFmt = '0.0"%"';
    sheet.getColumn('D').numFmt = '#,##0';
    sheet.getColumn('B').width = 40; // Wider for URLs

    sheet.views = [{ state: 'frozen', ySplit: 1 }];
    applyZebraStriping(sheet, 2, sheet.lastRow?.number || 1);
    autoFitColumns(sheet);
}

/**
 * Sheet 11: AI Device Breakdown
 */
function createDeviceBreakdownSheet(workbook: ExcelJS.Workbook, data: ExportData) {
    const sheet = workbook.addWorksheet('AI Device Breakdown');

    const headers = ['Device Category', 'Users', 'Sessions', '% Share'];
    sheet.addRow(headers);
    styleHeader(sheet.getRow(1));

    const totalUsers = data.aiDeviceData.reduce((sum, device) => sum + (device.value || 0), 0);

    data.aiDeviceData.forEach((device) => {
        const share = totalUsers > 0 ? ((device.value / totalUsers) * 100).toFixed(1) : '0';
        sheet.addRow([
            device.name || 'N/A',
            device.value || 0,
            device.sessions || 0,
            parseFloat(share),
        ]);
    });

    // Summary row
    const lastRow = sheet.lastRow?.number || 1;
    const summaryRow = sheet.addRow([
        'TOTAL',
        { formula: `SUM(B2:B${lastRow})` },
        { formula: `SUM(C2:C${lastRow})` },
        100,
    ]);
    summaryRow.font = { bold: true };

    sheet.getColumn('D').numFmt = '0.0"%"';
    sheet.getColumn('B').numFmt = '#,##0';
    sheet.getColumn('C').numFmt = '#,##0';

    // Conditional formatting
    sheet.addConditionalFormatting({
        ref: `B2:B${lastRow}`,
        rules: [
            {
                type: 'colorScale',
                cfvo: [
                    { type: 'min' },
                    { type: 'max' },
                ],
                color: [
                    { argb: 'FFFFFFFF' },
                    { argb: COLORS.successGreen },
                ],
                priority: 1,
            },
        ],
    });

    sheet.views = [{ state: 'frozen', ySplit: 1 }];
    applyZebraStriping(sheet, 2, lastRow + 1);
    autoFitColumns(sheet);
}

/**
 * Sheet 12: Demographics - AI Model Usage by Country
 */
function createDemographicsSheet(workbook: ExcelJS.Workbook, data: ExportData) {
    const sheet = workbook.addWorksheet('Demographics');

    // Headers: Country, ChatGPT, Perplexity, Copilot, Claude, Gemini, Total
    const headers = ['Country', 'ChatGPT', 'Perplexity', 'Copilot', 'Claude', 'Gemini', 'Total Users'];
    sheet.addRow(headers);
    styleHeader(sheet.getRow(1));

    // Sort by total users from all AI models descending
    const sortedData = [...data.demographicsData].sort((a, b) => {
        const aTotal = Object.keys(a).filter(k => k !== 'country').reduce((sum, k) => sum + (parseFloat(a[k]) || 0), 0);
        const bTotal = Object.keys(b).filter(k => k !== 'country').reduce((sum, k) => sum + (parseFloat(b[k]) || 0), 0);
        return bTotal - aTotal;
    });

    sortedData.forEach((demo) => {
        const chatgpt = parseFloat(demo.ChatGPT) || 0;
        const perplexity = parseFloat(demo.Perplexity) || 0;
        const copilot = parseFloat(demo.Copilot) || 0;
        const claude = parseFloat(demo.Claude) || 0;
        const gemini = parseFloat(demo.Gemini) || 0;
        const total = chatgpt + perplexity + copilot + claude + gemini;

        sheet.addRow([
            demo.country || 'N/A',
            chatgpt,
            perplexity,
            copilot,
            claude,
            gemini,
            total,
        ]);
    });

    // Total row
    const lastRow = sheet.lastRow?.number || 1;
    const totalRow = sheet.addRow([
        'TOTAL',
        { formula: `SUM(B2:B${lastRow})` },
        { formula: `SUM(C2:C${lastRow})` },
        { formula: `SUM(D2:D${lastRow})` },
        { formula: `SUM(E2:E${lastRow})` },
        { formula: `SUM(F2:F${lastRow})` },
        { formula: `SUM(G2:G${lastRow})` },
    ]);
    totalRow.font = { bold: true };

    // Format all numeric columns
    sheet.getColumn('B').numFmt = '#,##0';
    sheet.getColumn('C').numFmt = '#,##0';
    sheet.getColumn('D').numFmt = '#,##0';
    sheet.getColumn('E').numFmt = '#,##0';
    sheet.getColumn('F').numFmt = '#,##0';
    sheet.getColumn('G').numFmt = '#,##0';

    // Color code the model column headers
    const headerRow = sheet.getRow(1);
    const MODEL_COLORS: Record<string, string> = {
        'B': 'FF10B981', // ChatGPT - Green
        'C': 'FF3B82F6', // Perplexity - Blue
        'D': 'FFF59E0B', // Copilot - Amber
        'E': 'FF8B5CF6', // Claude - Violet
        'F': 'FFEF4444', // Gemini - Red
    };

    ['B', 'C', 'D', 'E', 'F'].forEach((col) => {
        const cell = headerRow.getCell(col);
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: MODEL_COLORS[col] },
        };
        cell.font = { color: { argb: 'FFFFFFFF' }, bold: true, size: 11 };
    });

    sheet.views = [{ state: 'frozen', ySplit: 1 }];
    applyZebraStriping(sheet, 2, lastRow + 1);
    autoFitColumns(sheet);
}

/**
 * Sheet 13: Search Console Performance
 */
function createSearchConsoleSheet(workbook: ExcelJS.Workbook, data: ExportData) {
    const sheet = workbook.addWorksheet('Search Console Performance');

    let currentRow = 1;

    // Section 1: Long-Tail Query Performance Over Time
    sheet.mergeCells(`A${currentRow}:E${currentRow}`);
    sheet.getCell(`A${currentRow}`).value = 'Long-Tail Query Performance Over Time';
    sheet.getCell(`A${currentRow}`).font = { bold: true, size: 12 };
    sheet.getCell(`A${currentRow}`).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: COLORS.headerBg },
    };
    sheet.getCell(`A${currentRow}`).font.color = { argb: COLORS.headerText };
    currentRow++;

    const chartHeaders = ['Date', 'Clicks', 'Impressions', 'CTR', 'Position'];
    sheet.addRow(chartHeaders);
    styleHeader(sheet.getRow(currentRow));
    currentRow++;

    const chartStartRow = currentRow;
    data.scChartData.forEach((row) => {
        const ctr = row.impressions > 0 ? ((row.clicks / row.impressions) * 100).toFixed(2) : '0';
        sheet.addRow([
            formatDate(row.date),
            row.clicks || 0,
            row.impressions || 0,
            parseFloat(ctr),
            parseFloat(row.position?.toFixed(1) || '0'),
        ]);
        currentRow++;
    });

    // Average row for section 1
    const chartEndRow = currentRow - 1;
    const avgRow = sheet.addRow([
        'TOTAL/AVERAGE',
        { formula: `SUM(B${chartStartRow}:B${chartEndRow})` },
        { formula: `SUM(C${chartStartRow}:C${chartEndRow})` },
        { formula: `AVERAGE(D${chartStartRow}:D${chartEndRow})` },
        { formula: `AVERAGE(E${chartStartRow}:E${chartEndRow})` },
    ]);
    avgRow.font = { bold: true };
    currentRow += 2;

    // Section 2: Top Long-Tail Queries
    sheet.mergeCells(`A${currentRow}:E${currentRow}`);
    sheet.getCell(`A${currentRow}`).value = 'Top Long-Tail Queries';
    sheet.getCell(`A${currentRow}`).font = { bold: true, size: 12 };
    sheet.getCell(`A${currentRow}`).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: COLORS.headerBg },
    };
    sheet.getCell(`A${currentRow}`).font.color = { argb: COLORS.headerText };
    currentRow++;

    const queryHeaders = ['Query', 'Clicks', 'Impressions', 'CTR', 'Position'];
    sheet.addRow(queryHeaders);
    styleHeader(sheet.getRow(currentRow));
    currentRow++;

    const queryStartRow = currentRow;
    data.scTopQueries.forEach((query) => {
        const ctr = query.impressions > 0 ? ((query.clicks / query.impressions) * 100).toFixed(2) : '0';
        sheet.addRow([
            query.query || 'N/A',
            query.clicks || 0,
            query.impressions || 0,
            parseFloat(ctr),
            parseFloat(query.position?.toFixed(1) || '0'),
        ]);
        currentRow++;
    });

    // Average row for section 2
    const queryEndRow = currentRow - 1;
    const queryAvgRow = sheet.addRow([
        'TOTAL/AVERAGE',
        { formula: `SUM(B${queryStartRow}:B${queryEndRow})` },
        { formula: `SUM(C${queryStartRow}:C${queryEndRow})` },
        { formula: `AVERAGE(D${queryStartRow}:D${queryEndRow})` },
        { formula: `AVERAGE(E${queryStartRow}:E${queryEndRow})` },
    ]);
    queryAvgRow.font = { bold: true };

    // Format columns
    sheet.getColumn('D').numFmt = '0.00"%"';
    sheet.getColumn('E').numFmt = '0.0';
    sheet.getColumn('B').numFmt = '#,##0';
    sheet.getColumn('C').numFmt = '#,##0';
    sheet.getColumn('A').width = 50; // Wider for queries

    // Conditional formatting for position
    sheet.addConditionalFormatting({
        ref: `E${chartStartRow}:E${queryEndRow}`,
        rules: [
            {
                type: 'cellIs',
                operator: 'lessThan',
                formulae: ['5'],
                style: {
                    fill: {
                        type: 'pattern',
                        pattern: 'solid',
                        bgColor: { argb: COLORS.successGreen },
                    },
                },
                priority: 1,
            },
            {
                type: 'cellIs',
                operator: 'greaterThan',
                formulae: ['20'],
                style: {
                    fill: {
                        type: 'pattern',
                        pattern: 'solid',
                        bgColor: { argb: COLORS.dangerRed },
                    },
                },
                priority: 2,
            },
        ],
    });

    applyZebraStriping(sheet, chartStartRow, currentRow);
    autoFitColumns(sheet);
}

// ============= MAIN EXPORT FUNCTION =============

/**
 * Main export function - Creates and downloads Excel workbook
 */
export async function exportAnalyticsToExcel(data: ExportData): Promise<void> {
    try {
        // Create workbook
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'GEO-Tracker Analytics';
        workbook.created = new Date();

        // Create all sheets (Overview sheet removed - starting from Website Traffic Trends)
        // createOverviewSheet(workbook, data);
        createTrafficTrendsSheet(workbook, data);

        if (data.aiOverviewStats.pages.length > 0 || data.aiOverviewStats.devices.length > 0) {
            createAIOverviewStatsSheet(workbook, data);
        }

        if (data.firstTouchData.length > 0) {
            createFirstTouchSheet(workbook, data);
        }

        if (data.zeroTouchData.length > 0) {
            createZeroTouchSheet(workbook, data);
        }

        if (data.conversionRateData.length > 0) {
            createConversionRateSheet(workbook, data);
        }

        if (data.topicClusterData.length > 0) {
            createTopicClustersSheet(workbook, data);
        }

        if (data.aiGrowthData.length > 0) {
            createAIGrowthSheet(workbook, data);
        }

        if (data.aiModelsData.filter(m => m.users > 0).length > 0) {
            createAIModelsSheet(workbook, data);
        }

        if (data.aiLandingPageData.length > 0) {
            createLandingPagesSheet(workbook, data);
        }

        if (data.aiDeviceData.length > 0) {
            createDeviceBreakdownSheet(workbook, data);
        }

        if (data.demographicsData.length > 0) {
            createDemographicsSheet(workbook, data);
        }

        if (data.scChartData.length > 0 || data.scTopQueries.length > 0) {
            createSearchConsoleSheet(workbook, data);
        }

        // Generate buffer
        const buffer = await workbook.xlsx.writeBuffer();

        // Create filename
        const date = new Date().toISOString().split('T')[0];
        const filename = `${data.workspaceName.toLowerCase().replace(/\s+/g, '-')}-analytics-${date}.xlsx`;

        // Download file
        const blob = new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        saveAs(blob, filename);

        console.log('Excel export completed successfully:', filename);
    } catch (error) {
        console.error('Excel export failed:', error);
        throw error;
    }
}
