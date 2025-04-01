document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    // General App
    const homeButton = document.getElementById('home-button');
    const sidebarToggleButton = document.getElementById('sidebar-toggle-btn');
    const mainLayout = document.querySelector('.main-layout');
    const pastScansList = document.getElementById('past-scans-list'); // Represents "Analysis Periods"

    // Home View - Data Sources & Settings
    const homeView = document.getElementById('home-view');
    const mainTitle = document.getElementById('main-title'); // Title on Home View
    const verifyEmailBtn = document.getElementById('verify-email-btn');
    const emailInput = document.getElementById('email');
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    const emailStatusIcon = document.getElementById('email-status-icon');
    const emailStatusText = document.getElementById('email-status-text');
    const bankStatementUploadInput = document.getElementById('bank-statement-upload');
    const receiptUploadInput = document.getElementById('receipt-upload');
    const uploadedBankStatementsList = document.getElementById('uploaded-bank-statements-list');
    const uploadedReceiptsList = document.getElementById('uploaded-receipts-list');
    const analyzeButton = document.getElementById('analyze-button'); // Renamed from scanButton

    // Analysis Results View
    const scanResultsView = document.getElementById('scan-results-view');
    const scanTitle = document.getElementById('scan-title'); // Title on Results View
    const undoButton = document.getElementById('undo-button');
    const undoCountSpan = document.getElementById('undo-count');
    const exportExcelBtn = document.getElementById('export-excel-btn');
    const downloadSourcesBtn = document.getElementById('download-sources-btn'); // Renamed button
    const deductionsTableBody = document.querySelector('#deductions-table tbody');
    // Consolidated Details Panel Elements
    const detailsPanel = document.getElementById('source-details-panel');
    const detailHeader = document.getElementById('detail-header');
    const detailContent = document.getElementById('detail-content');
    const detailAttachmentsList = document.getElementById('detail-attachments-list');


    // --- State ---
    let isEmailVerified = false;
    let activeScanId = null; // ID of the analysis period currently viewed
    let currentScanData = []; // Working copy of deductions for the active period
    let pseudoPastScans = []; // Stores { id, name } for sidebar list (Analysis Periods)
    let pseudoPastScansDataStore = {}; // Stores { scanId: [deductionObjects] }
    let simulatedUploadedFiles = { bank: [], receipts: [] }; // Track simulated uploads for the current session
    let selectedRowElement = null; // Reference to the selected TR element
    let nextRowId = 1; // Unique row IDs within a session
    const MAX_UNDO_STEPS = 10;
    let undoStack = [];

    // --- Pseudo Data (Mock Backend & AI Simulation) ---

    // Simulates email data (remains the same)
    const pseudoEmails = {
        "msg_id_7a3b": { subject: "Receipt for Software Subscription - Pro Tools Annual", body: "Dear John Doe,\n\nThank you...\nPayment: $150.00 on March 15, 2025...", attachments: ["receipt_protools.pdf"] },
        "msg_id_9c1d": { subject: "Your Office Supplies Co. Order Confirmation #ORD-87651", body: "Hi John,\n\nOrder confirmed...\nItem: Ergonomic Monitor Stand...\nPrice: $45.50\nDate: February 20, 2025...", attachments: ["invoice_monitor_stand.pdf", "shipping_details.txt"] },
        "msg_id_b2e8": { subject: "Re: Travel Expense Approval - Client Meeting Jan 10", body: "Hi John,\n\nApproved...\nTrain ticket...\nAmount: $85.00\nDate: January 10, 2025...", attachments: ["train_ticket_011025.jpg"] },
        "msg_id_f5a9": { subject: "FWD: Your Monthly Cloud Storage Invoice [Acme Cloud]", body: "Forwarded...\nAmount Due: $25.00\nDate: March 1, 2025...", attachments: ["cloud_storage_mar25.pdf"] },
        "msg_id_c4a1": { subject: "Receipt: Professional Development Course - Advanced JavaScript", body: "RECEIPT...\nCourse: Advanced JavaScript...\nDate: January 28, 2025\nAmount Paid: $499.00...", attachments: ["course_receipt_js.pdf"] },
        "msg_id_e9b3": { subject: "Your Domain Renewal - mybusiness.example.com", body: "Dear John Doe,\n\nDomain renewed...\nDate: March 5, 2025\nCost: $15.99...", attachments: ["domain_renewal_invoice_9876.pdf"] },
        "msg_id_a0d7": { subject: "Client Dinner Expense - Project Phoenix", body: "Team,\n\nReceipt attached...\nDate: Feb 12, 2025\nAmount: $180.30...", attachments: ["client_dinner_feb12.png"] },
        "msg_id_1123": { subject: "Internet Bill - March 2025", body: "Account: JD-IBIZ...\nDate: March 20, 2025\nTotal Due: $109.00...", attachments: ["internet_bill_mar25.pdf"] },
        "msg_id_5566": { subject: "Lunch Meeting Receipt", body: "Receipt attached...\nDate: Mar 28, 2025\nAmount: $45.60...", attachments: ["lunch_mar28.jpg"] },
        "email_missing_ref": { subject: "Unknown Source", body: "Source details not available.", attachments: [] },
        "manual_entry": { subject: "Manual Entry / Modification", body: "This deduction was added or modified manually.", attachments: [] }
    };

    // Simulates file data store (AI would process these)
    const pseudoFileData = {
        "bank_statement_jan25.pdf": { type: "Bank Statement", content_summary: "Contains various transactions including:\n- Transfer to Savings: $500\n- Payment: AWS Services $75.50 (Jan 15)\n- Deposit: Client Payment $1200" },
        "bank_statement_feb25.pdf": { type: "Bank Statement", content_summary: "Contains transactions like:\n- Payment: Adobe Creative Cloud $52.99 (Feb 5)\n- Withdrawal: ATM $100\n- Payment: Office Lease $850 (Feb 1)" },
        "staples_receipt_feb18.pdf": { type: "Receipt", content_summary: "Items:\n- Printer Paper: $12.99\n- Pens (Box): $8.50\nTotal: $21.49" },
        "health_insurance_q1.pdf": { type: "Insurance Statement", content_summary: "Quarterly Premium: $650.00\nPeriod: Jan 1 - Mar 31, 2025" },
        "investment_summary_2025.csv": { type: "Investment Summary", content_summary: "Trade History:\n- BUY AAPL 10 shares @ $170 (Jan 20)\n- SELL GOOG 5 shares @ $2800 (Mar 10)\nDividend Received: MSFT $35.00 (Feb 15)" }
    };


    // Initializes the mock data on load
    function initializePseudoData() {
        pseudoPastScans = [ // Represents Analysis Periods now
            { id: "scan1", name: "Q1 2025 Analysis" },
            { id: "scan2", name: "Recent Expenses (Mar 2025)" }
        ];

        // *** UPDATED: Added sourceType and sourceRef/sourceFilename ***
        const initialScan1Data = [
            // Existing Email-sourced items
            { rowId: 1, description: "Pro Tools Software Subscription", amount: 150.00, date: "2025-03-15", category: "Software", sourceType: "email", sourceRef: "msg_id_7a3b", attachment: "receipt_protools.pdf" },
            { rowId: 2, description: "Ergonomic Monitor Stand", amount: 45.50, date: "2025-02-20", category: "Office Supplies", sourceType: "email", sourceRef: "msg_id_9c1d", attachment: "invoice_monitor_stand.pdf" },
            { rowId: 3, description: "Train Ticket (Client Meeting)", amount: 85.00, date: "2025-01-10", category: "Travel", sourceType: "email", sourceRef: "msg_id_b2e8", attachment: "train_ticket_011025.jpg" },
            { rowId: 5, description: "Adv. JavaScript Course", amount: 499.00, date: "2025-01-28", category: "Professional Development", sourceType: "email", sourceRef: "msg_id_c4a1", attachment: "course_receipt_js.pdf" },
            { rowId: 7, description: "Client Dinner (Project Phoenix)", amount: 180.30, date: "2025-02-12", category: "Meals & Entertainment", sourceType: "email", sourceRef: "msg_id_a0d7", attachment: "client_dinner_feb12.png" },
            // NEW: Items simulated from file uploads
            { rowId: 10, description: "AWS Services Payment", amount: 75.50, date: "2025-01-15", category: "Cloud Services", sourceType: "bank-statement", sourceRef: "bank_statement_jan25.pdf", attachment: null },
            { rowId: 11, description: "Adobe Creative Cloud", amount: 52.99, date: "2025-02-05", category: "Software", sourceType: "bank-statement", sourceRef: "bank_statement_feb25.pdf", attachment: null },
            { rowId: 12, description: "Office Lease Payment", amount: 850.00, date: "2025-02-01", category: "Rent/Lease", sourceType: "bank-statement", sourceRef: "bank_statement_feb25.pdf", attachment: null },
            { rowId: 13, description: "Office Supplies (Staples)", amount: 21.49, date: "2025-02-18", category: "Office Supplies", sourceType: "receipt-pdf", sourceRef: "staples_receipt_feb18.pdf", attachment: "staples_receipt_feb18.pdf" },
            { rowId: 14, description: "Health Insurance Premium Q1", amount: 650.00, date: "2025-03-31", category: "Insurance", sourceType: "insurance-pdf", sourceRef: "health_insurance_q1.pdf", attachment: "health_insurance_q1.pdf" },
            { rowId: 15, description: "MSFT Dividend Income", amount: -35.00, date: "2025-02-15", category: "Investment Income", sourceType: "investment-csv", sourceRef: "investment_summary_2025.csv", attachment: null }, // Note: Negative amount for income
        ];
        const initialScan2Data = [
            // Existing Email-sourced items
             { rowId: 4, description: "Cloud Storage Service", amount: 25.00, date: "2025-03-01", category: "Utilities", sourceType: "email", sourceRef: "msg_id_f5a9", attachment: "cloud_storage_mar25.pdf" },
             { rowId: 6, description: "Domain Renewal mybusiness.example.com", amount: 15.99, date: "2025-03-05", category: "Web Hosting/Domains", sourceType: "email", sourceRef: "msg_id_e9b3", attachment: "domain_renewal_invoice_9876.pdf" },
             { rowId: 8, description: "Business Internet Bill", amount: 109.00, date: "2025-03-20", category: "Utilities", sourceType: "email", sourceRef: "msg_id_1123", attachment: "internet_bill_mar25.pdf" },
             { rowId: 9, description: "Lunch with Supplier XYZ", amount: 45.60, date: "2025-03-28", category: "Meals", sourceType: "email", sourceRef: "msg_id_5566", attachment: "lunch_mar28.jpg" },
             // Add more file-based items relevant to March if desired
        ];

        pseudoPastScansDataStore = {
            "scan1": initialScan1Data.map(d => ({...d})),
            "scan2": initialScan2Data.map(d => ({...d}))
        };

        let maxId = 0;
        Object.values(pseudoPastScansDataStore).forEach(scanData => {
            scanData.forEach(item => { if (item.rowId > maxId) maxId = item.rowId; });
        });
        nextRowId = maxId + 1;

        renderPastScans();
    }


    // --- UI Update Functions ---

    // Updates the email verification status UI
    function updateEmailStatusUI() {
        if (isEmailVerified) {
            emailStatusIcon.className = 'fas fa-check-circle fa-4x status-icon-verified';
            emailStatusText.textContent = "EMAIL VERIFIED";
            emailStatusText.className = 'verified';
            verifyEmailBtn.textContent = "Verified";
            verifyEmailBtn.disabled = true;
            verifyEmailBtn.classList.add('verified');
            emailInput.disabled = true;
            // Enable Analyze button only if email is verified (can add file checks later)
            analyzeButton.disabled = false;
        } else {
            emailStatusIcon.className = 'fas fa-envelope fa-4x status-icon-unverified';
            emailStatusText.textContent = "EMAIL NOT VERIFIED";
            emailStatusText.className = 'unverified';
            verifyEmailBtn.textContent = "Verify Email";
            verifyEmailBtn.disabled = false;
            verifyEmailBtn.classList.remove('verified');
            emailInput.disabled = false;
            analyzeButton.disabled = true; // Disable if email not verified
        }
    }

    // Switches between 'home' and 'results' views
    function showView(viewToShow) {
        homeView.style.display = 'none';
        scanResultsView.style.display = 'none';
        homeButton.classList.remove('active');

        if (viewToShow === 'home') {
            homeView.style.display = 'block';
            mainTitle.style.display = 'block';
            homeButton.classList.add('active');
            activeScanId = null;
            currentScanData = [];
            undoStack = [];
            updateUndoButton();
            resetDetailsPanel();
            renderPastScans(); // Clear active state in sidebar
        } else if (viewToShow === 'results') {
            scanResultsView.style.display = 'flex';
            mainTitle.style.display = 'none'; // Hide generic home title
            if (activeScanId && pseudoPastScansDataStore[activeScanId]) {
                currentScanData = pseudoPastScansDataStore[activeScanId].map(item => ({ ...item }));
                renderDeductionsTable(currentScanData);
                const scanInfo = pseudoPastScans.find(s => s.id === activeScanId);
                scanTitle.textContent = `Analysis: ${scanInfo ? scanInfo.name : 'Unknown Period'}`;
            } else {
                console.error("Attempted to show results view without valid activeScanId or data.");
                scanTitle.textContent = "Error: Analysis Data Not Found";
                currentScanData = [];
                renderDeductionsTable([]);
            }
            undoStack = []; // Clear undo on load
            updateUndoButton();
            resetDetailsPanel();
            renderPastScans(); // Highlight active scan
        }
    }

    // --- Autosave & Undo Logic (Largely unchanged) ---
    function autoSaveChanges() {
        if (!activeScanId || !pseudoPastScansDataStore.hasOwnProperty(activeScanId)) {
            console.error("Autosave failed: No active analysis ID or data store entry.");
            return;
        }
        pseudoPastScansDataStore[activeScanId] = currentScanData.map(item => ({ ...item }));
        // console.log(`Autosaved data for analysisId: ${activeScanId}`);
    }

    function pushUndoAction(action) {
        undoStack.push(action);
        if (undoStack.length > MAX_UNDO_STEPS) {
            undoStack.shift();
        }
        updateUndoButton();
    }

    function updateUndoButton() {
        const count = undoStack.length;
        undoCountSpan.textContent = count;
        undoButton.disabled = count === 0;
    }

    function performUndo() {
        if (undoStack.length === 0 || !activeScanId) return;

        const action = undoStack.pop();
        console.log("Attempting to undo:", action);
        let needsRerender = false;

        try {
             switch (action.type) {
                case 'delete':
                    currentScanData.splice(action.index, 0, action.data);
                    needsRerender = true;
                    break;
                case 'edit':
                     const editIndex = currentScanData.findIndex(item => String(item.rowId) === String(action.rowId)); // Ensure string comparison
                     if (editIndex > -1) {
                         currentScanData[editIndex][action.field] = action.oldValue;
                         needsRerender = true;
                     } else {
                          console.warn("Undo failed: Could not find rowId", action.rowId, "for edit action.");
                     }
                    break;
                default:
                    console.error("Unknown undo action type:", action.type);
                    updateUndoButton(); // Correct count if pop succeeded
                    return;
            }

            autoSaveChanges(); // Save the reverted state

            if (needsRerender) {
                 renderDeductionsTable(currentScanData);
                 // Re-select row or reset panel after undo
                 if (selectedRowElement && String(selectedRowElement.dataset.rowId) === String(action.rowId)) {
                     const reselectRow = deductiblesTableBody.querySelector(`tr[data-row-id="${action.rowId}"]`);
                     if(reselectRow) selectTableRow(reselectRow); else resetDetailsPanel();
                 } else if (action.type === 'delete') {
                      resetDetailsPanel(); // Reset details when undoing delete
                 }
            }

        } catch (error) {
            console.error("Error during undo operation:", error);
             renderDeductionsTable(currentScanData); // Attempt re-render on error
        }

        updateUndoButton();
        console.log("Undo complete.");
    }

     // Helper to get source type icon and label
    function getSourceTypeInfo(sourceType) {
        switch(sourceType?.toLowerCase()) {
            case 'email':           return { icon: 'fa-envelope', label: 'Email', color: '#007bff' };
            case 'receipt-pdf':     return { icon: 'fa-file-invoice-dollar', label: 'Receipt PDF', color: '#28a745' };
            case 'bank-statement':  return { icon: 'fa-landmark', label: 'Bank Stmt', color: '#17a2b8' };
            case 'insurance-pdf':   return { icon: 'fa-file-shield', label: 'Insurance PDF', color: '#fd7e14' };
            case 'investment-csv':  return { icon: 'fa-file-csv', label: 'Invest CSV', color: '#6f42c1' };
            case 'manual':          return { icon: 'fa-pencil', label: 'Manual', color: '#6c757d' };
            default:                return { icon: 'fa-question-circle', label: 'Unknown', color: '#dc3545' };
        }
    }

     // Helper to format cell content
     function formatCellContent(field, value, item = null) { // Pass full item for context if needed
        if (value === null || typeof value === 'undefined' || value === '') return '---';

        switch(field) {
            case 'amount':
                const numValue = Number(value);
                return isNaN(numValue) ? '$0.00' : `$${numValue.toFixed(2)}`;
            case 'attachment':
                 return value ? `<a href="#" class="attachment-link" data-attachment="${value}" title="Simulate opening ${value}"><i class="fas fa-link"></i> ${value}</a>` : '---';
            case 'date':
                try { return new Date(value + 'T00:00:00Z').toLocaleDateString('en-CA'); } // YYYY-MM-DD
                catch (e) { return value; } // Fallback
            case 'sourceType':
                const typeInfo = getSourceTypeInfo(value);
                return `<i class="fas ${typeInfo.icon}" style="color:${typeInfo.color};" title="${typeInfo.label}"></i>`;
            case 'sourceRef': // Display email key or filename
                 return String(value);
            default: // Description, Category
                return String(value);
        }
    }

    // --- Table Rendering and Interaction ---
    function renderDeductionsTable(deductions) {
        deductionsTableBody.innerHTML = '';
        if (!deductions || deductions.length === 0) {
            deductionsTableBody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 20px; color: var(--text-muted);">No potential deductions found for this analysis period.</td></tr>`;
            return;
        }

        deductions.forEach(item => {
            const row = document.createElement('tr');
            row.dataset.rowId = item.rowId;
            row.dataset.sourceType = item.sourceType; // Store sourceType for details panel
            row.dataset.sourceRef = item.sourceRef; // Store sourceRef

            const editableFields = ['description', 'amount', 'date', 'category'];

            row.innerHTML = `
                <td data-field="description" ${editableFields.includes('description') ? 'class="editable"' : ''}>${formatCellContent('description', item.description, item)}</td>
                <td data-field="amount" ${editableFields.includes('amount') ? 'class="editable"' : ''} style="text-align: right;">${formatCellContent('amount', item.amount, item)}</td>
                <td data-field="date" ${editableFields.includes('date') ? 'class="editable"' : ''}>${formatCellContent('date', item.date, item)}</td>
                <td data-field="category" ${editableFields.includes('category') ? 'class="editable"' : ''}>${formatCellContent('category', item.category, item)}</td>
                <td class="source-type-cell" data-field="sourceType">${formatCellContent('sourceType', item.sourceType, item)}</td>
                <td data-field="sourceRef">${formatCellContent('sourceRef', item.sourceRef, item)}</td>
                <td data-field="attachment">${formatCellContent('attachment', item.attachment, item)}</td>
                <td class="actions-cell">
                    <button class="icon-button delete-row-btn" title="Delete Row"><i class="fas fa-trash-alt"></i></button>
                </td>
            `;
            deductionsTableBody.appendChild(row);
        });

        // Re-apply selection visual state
        if (selectedRowElement) {
            const selectedRowId = selectedRowElement.dataset.rowId;
             const stillExists = currentScanData.some(item => String(item.rowId) === selectedRowId);
             if (stillExists) {
                  const reselectRow = deductiblesTableBody.querySelector(`tr[data-row-id="${selectedRowId}"]`);
                  if (reselectRow) {
                       reselectRow.classList.add('selected');
                       selectedRowElement = reselectRow;
                  } else { selectedRowElement = null; }
             } else {
                  selectedRowElement = null;
                  resetDetailsPanel();
             }
        } else {
             resetDetailsPanel();
        }
    }

    // Handle clicks within the table body
    function handleTableCellClick(event) {
        const target = event.target;
        const cell = target.closest('td');
        const row = target.closest('tr');

        if (!row || !row.dataset.rowId) return; // Click outside data row

        const rowId = row.dataset.rowId;

        // Delete button
        if (target.closest('.delete-row-btn')) {
            deleteTableRow(rowId); return;
        }
        // Attachment link simulation
        if (target.closest('.attachment-link')) {
            event.preventDefault();
            const attachmentName = target.closest('.attachment-link').dataset.attachment;
            alert(`Simulating opening attachment: ${attachmentName}\n(This is a mock-up action)`);
            return;
        }
        // Row selection
        if (cell && !cell.classList.contains('actions-cell')) {
             selectTableRow(row);
        }
     }

    // Handle double-clicks for editing
    function handleTableCellDoubleClick(event) {
        const cell = event.target.closest('td');
        if (!cell || !cell.classList.contains('editable') || cell.classList.contains('editing')) return;
        makeCellEditable(cell);
     }

    // Makes a cell editable (mostly unchanged, ensures correct rowId comparison)
    function makeCellEditable(cell) {
        if (cell.classList.contains('editing')) return;

        const row = cell.closest('tr');
        const rowId = row.dataset.rowId;
        const field = cell.dataset.field;
        const dataIndex = currentScanData.findIndex(item => String(item.rowId) === rowId); // String comparison
        if (dataIndex === -1) { console.error("Cannot edit: Row data not found."); return; }

        const originalValue = currentScanData[dataIndex][field];
        const originalFormattedContent = cell.innerHTML;

        let inputType = 'text';
        let step = null;
        if (field === 'amount') { inputType = 'number'; step = '0.01'; }
        else if (field === 'date') { inputType = 'date'; }

        cell.classList.add('editing');
        cell.innerHTML = '';

        const input = document.createElement('input');
        input.type = inputType;
        if (step) input.step = step;
        input.className = 'edit-input';
        input.value = (inputType === 'date' && originalValue) ? String(originalValue).split('T')[0] : originalValue;

        cell.appendChild(input);
        input.focus();
        if (input.select && inputType !== 'date') input.select();

        const handleEditEnd = (saveChange) => {
            input.removeEventListener('blur', handleBlur);
            input.removeEventListener('keydown', handleKeyDown);

            const newValueRaw = input.value;
            let newValue = newValueRaw;
            let isValid = true;

            if (field === 'amount') {
                newValue = parseFloat(newValueRaw);
                if (isNaN(newValue)) { // Allow negative for income adjustments? Check requirements. For now, just check NaN.
                    alert("Invalid amount. Please enter a number."); isValid = false;
                }
            } else if (field === 'date') {
                if (!newValueRaw || !/^\d{4}-\d{2}-\d{2}$/.test(newValueRaw)) {
                     alert("Invalid date format. Please use YYYY-MM-DD."); isValid = false;
                }
                 newValue = newValueRaw;
            } else { // Description, Category
                newValue = newValueRaw.trim();
                 if (field === 'description' && !newValue) {
                     alert("Description cannot be empty."); isValid = false;
                 }
            }

            cell.classList.remove('editing');

            if (saveChange && isValid && newValue !== originalValue) {
                 pushUndoAction({ type: 'edit', rowId: rowId, field: field, oldValue: originalValue, newValue: newValue });
                 currentScanData[dataIndex][field] = newValue;
                 autoSaveChanges();
                 // Pass the full item to formatCellContent if needed for context
                 cell.innerHTML = formatCellContent(field, newValue, currentScanData[dataIndex]);
            } else {
                 cell.innerHTML = originalFormattedContent;
            }
        };

        const handleBlur = () => setTimeout(() => handleEditEnd(true), 100);
        const handleKeyDown = (e) => {
            if (e.key === 'Enter') { e.preventDefault(); handleEditEnd(true); }
            else if (e.key === 'Escape') { e.preventDefault(); handleEditEnd(false); }
        };

        input.addEventListener('blur', handleBlur);
        input.addEventListener('keydown', handleKeyDown);
    }

    // Updates the consolidated details panel when a row is selected
    function selectTableRow(rowElement) {
         if (selectedRowElement) {
            selectedRowElement.classList.remove('selected');
        }
        rowElement.classList.add('selected');
        selectedRowElement = rowElement;

        const rowId = rowElement.dataset.rowId;
        const deductionData = currentScanData.find(d => String(d.rowId) === rowId);

        if (!deductionData) {
            resetDetailsPanel();
            return;
        }

        const sourceType = deductionData.sourceType;
        const sourceRef = deductionData.sourceRef; // Could be email key or filename
        const typeInfo = getSourceTypeInfo(sourceType);

        // Update Header
        detailHeader.innerHTML = `
            <i class="fas ${typeInfo.icon}" style="color:${typeInfo.color};"></i> ${typeInfo.label} Details
            <span class="detail-source-info">Ref: ${sourceRef || 'N/A'}</span>
        `;

        // Update Content based on source type
        let contentHTML = `<p class="placeholder-text">Details for this source type are simulated.</p>`; // Default
        if (sourceType === 'email' && pseudoEmails[sourceRef]) {
            const emailData = pseudoEmails[sourceRef];
            contentHTML = `<strong>Subject:</strong> ${emailData.subject || '(No Subject)'}<br><hr>${emailData.body || '(No Body Content)'}`;
        } else if (pseudoFileData[sourceRef]) {
             const fileData = pseudoFileData[sourceRef];
             contentHTML = `<strong>File:</strong> ${sourceRef}<br>`;
             contentHTML += `<strong>Detected Type:</strong> ${fileData.type}<br><hr>`;
             contentHTML += `<strong>Simulated AI Summary:</strong>\n${fileData.content_summary || '(No summary generated)'}`;
        } else if (sourceType === 'manual') {
             contentHTML = `<p>This entry was added or last modified manually.</p>`;
        }
        detailContent.innerHTML = contentHTML;

        // Update Attachments List
        detailAttachmentsList.innerHTML = '';
        let attachmentsToShow = [];
        if (sourceType === 'email' && pseudoEmails[sourceRef]?.attachments?.length > 0) {
             attachmentsToShow = pseudoEmails[sourceRef].attachments;
        } else if (deductionData.attachment) { // Check the deduction's own attachment field
             attachmentsToShow = [deductionData.attachment];
        } else if (sourceType !== 'email' && sourceRef && pseudoFileData[sourceRef]) {
             // If it's a file source, list the source file itself as primary "attachment"
             attachmentsToShow = [sourceRef];
        }

        if (attachmentsToShow.length > 0) {
            attachmentsToShow.forEach(att => {
                if (!att) return;
                const li = document.createElement('li');
                li.innerHTML = `<a href="#" class="attachment-link" data-attachment="${att}" title="Simulate opening ${att}"><i class="fas fa-paperclip"></i> ${att}</a>`;
                detailAttachmentsList.appendChild(li);
            });
        } else {
            detailAttachmentsList.innerHTML = '<li>No related files or attachments</li>';
        }
    }

     // Deletes a row (unchanged logic, just uses rowId)
     function deleteTableRow(rowId) {
         const rowIndex = currentScanData.findIndex(item => String(item.rowId) === String(rowId));
         if (rowIndex === -1) { console.warn("Delete failed: Row not found", rowId); return; }
         if (confirm("Are you sure you want to delete this deduction row? This can be undone temporarily.")) {
             const deletedData = { ...currentScanData[rowIndex] };
             pushUndoAction({ type: 'delete', index: rowIndex, data: deletedData });
             currentScanData.splice(rowIndex, 1);
             autoSaveChanges();
             if (selectedRowElement && selectedRowElement.dataset.rowId == rowId) {
                 resetDetailsPanel(); // Now resets the single panel
                 selectedRowElement = null;
             }
             renderDeductionsTable(currentScanData);
             console.log("Deleted row:", deletedData);
         }
     }

    // Resets the consolidated details panel
    function resetDetailsPanel() {
        detailHeader.innerHTML = `<i class="fas fa-info-circle"></i> Details <span class="detail-source-info">Select Item</span>`;
        detailContent.innerHTML = '<p class="placeholder-text">Select an item from the table to view details.</p>';
        detailAttachmentsList.innerHTML = '<li>No item selected</li>';
        if(selectedRowElement) {
            selectedRowElement.classList.remove('selected');
            selectedRowElement = null;
        }
    }

    // --- Past Scans (Analysis Periods) Functionality (Logic remains similar) ---
    function renderPastScans() {
        pastScansList.innerHTML = '';
        pseudoPastScans.forEach(scan => {
            const li = document.createElement('li');
            li.dataset.scanId = scan.id;
            if (scan.id === activeScanId) { li.classList.add('active-scan'); }
            li.innerHTML = `
                <span class="scan-name" title="Load Analysis: ${scan.name}">${scan.name}</span>
                <button class="icon-button rename-scan-btn" title="Rename"><i class="fas fa-pencil-alt"></i></button>
                <button class="icon-button delete-scan-btn" title="Delete"><i class="fas fa-trash-alt"></i></button>
            `;
           pastScansList.appendChild(li);
        });
    }

    function handlePastScanClick(event) {
        const target = event.target;
        const listItem = target.closest('li');
        if (!listItem || !listItem.dataset.scanId) return;
        const scanId = listItem.dataset.scanId;
        if (target.classList.contains('scan-name')) {
            if (scanId !== activeScanId) { loadPastScan(scanId); }
        } else if (target.closest('.rename-scan-btn')) {
            renamePastScan(listItem);
        } else if (target.closest('.delete-scan-btn')) {
            deletePastScan(scanId, listItem);
        }
    }

    function loadPastScan(scanId) { // Renamed conceptually, function is same
        console.log(`Loading analysis period: ${scanId}`);
        const scanInfo = pseudoPastScans.find(s => s.id === scanId);
        if (!scanInfo || !pseudoPastScansDataStore[scanId]) {
             console.error(`Analysis data or info not found for ID: ${scanId}`);
             alert(`Error: Could not load analysis ${scanId}.`);
             showView('home'); return;
        }
        activeScanId = scanId;
        showView('results'); // This loads data and renders
    }

    function renamePastScan(listItem) {
        const scanId = listItem.dataset.scanId;
        const nameSpan = listItem.querySelector('.scan-name');
        const currentName = nameSpan.textContent;
        const actionButtons = listItem.querySelectorAll('.icon-button');
        const input = document.createElement('input');
        input.type = 'text'; input.value = currentName; input.className = 'rename-input';
        nameSpan.style.display = 'none';
        actionButtons.forEach(btn => btn.style.display = 'none');
        listItem.insertBefore(input, nameSpan);
        input.focus(); input.select();
        const finalizeRename = (save) => {
             input.removeEventListener('blur', handleRenameBlur);
             input.removeEventListener('keydown', handleRenameKeydown);
             input.remove();
             const newName = input.value.trim();
             if (save && newName && newName !== currentName) {
                 nameSpan.textContent = newName; nameSpan.title = `Load Analysis: ${newName}`;
                 const scanIndex = pseudoPastScans.findIndex(s => s.id === scanId);
                 if (scanIndex > -1) { pseudoPastScans[scanIndex].name = newName; }
                 if(scanId === activeScanId) { scanTitle.textContent = `Analysis: ${newName}`; } // Update main title if active
                 console.log(`Renamed analysis ${scanId} to ${newName}`);
             } else { nameSpan.textContent = currentName; }
             nameSpan.style.display = '';
             actionButtons.forEach(btn => btn.style.display = '');
        };
        const handleRenameBlur = () => setTimeout(() => finalizeRename(true), 100);
        const handleRenameKeydown = (e) => {
            if (e.key === 'Enter') { e.preventDefault(); finalizeRename(true); }
            else if (e.key === 'Escape') { e.preventDefault(); finalizeRename(false); }
        };
        input.addEventListener('blur', handleRenameBlur);
        input.addEventListener('keydown', handleRenameKeydown);
    }

    function deletePastScan(scanId, listItem) {
        const scanName = listItem.querySelector('.scan-name').textContent;
        if (confirm(`Are you sure you want to permanently delete the analysis period "${scanName}" and its data? This cannot be undone.`)) {
             pseudoPastScans = pseudoPastScans.filter(s => s.id !== scanId);
             delete pseudoPastScansDataStore[scanId];
             listItem.remove();
             console.log(`Deleted analysis period: ${scanId}`);
             if (scanId === activeScanId) {
                 alert("The currently active analysis period has been deleted.");
                 showView('home');
             }
        }
    }

    // --- Sidebar Toggle ---
    function toggleSidebar() {
        mainLayout.classList.toggle('sidebar-collapsed');
    }

    // --- Simulation & Export/Download ---

    // Simulate file upload by adding filename to list
    function handleFileUpload(event, listElementId, fileType) {
        const listElement = document.getElementById(listElementId);
        const files = event.target.files;
        if (!files || files.length === 0) return;

        // Clear placeholder if it exists
        const placeholder = listElement.querySelector('.placeholder');
        if (placeholder) placeholder.remove();

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            // Basic type check simulation (can be more robust)
            // if (!file.type.includes('pdf') && !file.type.includes('csv') /* add other allowed types */ ) {
            //     alert(`File "${file.name}" has an unsupported type.`);
            //     continue;
            // }

            const listItem = document.createElement('li');
            const iconClass = file.name.endsWith('.pdf') ? 'fa-file-pdf' : file.name.endsWith('.csv') ? 'fa-file-csv' : 'fa-file';
            listItem.innerHTML = `<i class="fas ${iconClass}"></i> ${file.name}`;
            listElement.appendChild(listItem);

            // Add to simulated state (used by analyze button)
            simulatedUploadedFiles[fileType].push(file.name);
            console.log(`Simulated upload of ${fileType}: ${file.name}`);
        }
         // Optionally re-enable analyze button if files are uploaded, even if email isn't verified
         // analyzeButton.disabled = false;
    }

     // Export current table data to Excel
     function exportToExcel() {
         if (!currentScanData || currentScanData.length === 0) {
             alert("No data in the current view to export."); return;
         }
         console.log("Preparing data for Excel export...");

         // Prepare data for export (include Source Type, rename Source Ref)
         const exportData = currentScanData.map(({ rowId, ...rest }) => ({
             Description: rest.description,
             Amount: rest.amount,
             Date: rest.date,
             Category: rest.category,
             'Source Type': rest.sourceType, // Include Source Type
             'Source Ref': rest.sourceRef,   // Rename for clarity
             Attachment: rest.attachment
         }));

         try {
             const ws = XLSX.utils.json_to_sheet(exportData);
             const wb = XLSX.utils.book_new();
             XLSX.utils.book_append_sheet(wb, ws, "Deductions");
             const analysisNamePart = pseudoPastScans.find(s => s.id === activeScanId)?.name.replace(/[^a-z0-9]/gi, '_') || 'current_analysis';
             const filename = `TaxDeductTracker_${analysisNamePart}_${new Date().toISOString().split('T')[0]}.xlsx`;
             XLSX.writeFile(wb, filename);
             console.log("Excel export triggered.");
         } catch (error) {
             console.error("Error exporting to Excel:", error);
             alert("An error occurred while exporting to Excel. See console (F12).");
         }
     }

     // Simulates downloading source documents (emails, uploaded files)
     function downloadSourceDocuments() { // Renamed function
         if (!currentScanData || currentScanData.length === 0) {
             alert("No deductions loaded to fetch source documents for."); return;
         }
         console.log("Simulating download of source documents...");

         const sourceRefs = new Set(); // Collect unique email keys and filenames
         const sourceFilesToDownload = [];

         currentScanData.forEach(item => {
             if (item.sourceRef) {
                sourceRefs.add(item.sourceRef);
                // Also consider direct attachments if they differ from sourceRef
                if(item.attachment && item.attachment !== item.sourceRef) {
                    sourceRefs.add(item.attachment);
                }
             } else if (item.attachment) { // Fallback if only attachment exists
                 sourceRefs.add(item.attachment);
             }
         });

         if (sourceRefs.size === 0) {
             alert("No source references (emails or files) found in the current deductions list."); return;
         }

         // Build summary message
         let summary = `--- Simulation: Download Source Documents ---\n\n`;
         summary += `Would attempt to package ${sourceRefs.size} unique source documents:\n`;
         sourceRefs.forEach(ref => {
             let type = "Unknown";
             if (pseudoEmails[ref]) type = "Email";
             else if (pseudoFileData[ref]) type = pseudoFileData[ref].type;
             else if (ref.includes('.')) type = "File"; // Guess type

             summary += `\n- Source Ref: ${ref} (Type: ${type})\n`;
             sourceFilesToDownload.push({ref: ref, type: type}); // Store for potential real implementation
         });
         summary += "\n--- End Simulation ---";

         console.log(summary);
         alert(`Simulation Complete: ${sourceRefs.size} source documents identified for download.\nCheck the browser console (F12).\n\n(Actual download requires server-side integration.)`);
     }


    // --- Event Listeners Setup ---
    // Home View Controls
    verifyEmailBtn.addEventListener('click', () => {
        if (isEmailVerified) return;
        verifyEmailBtn.textContent = "Verifying..."; verifyEmailBtn.disabled = true;
        setTimeout(() => { isEmailVerified = true; updateEmailStatusUI(); }, 1500);
    });

    bankStatementUploadInput.addEventListener('change', (e) => handleFileUpload(e, 'uploaded-bank-statements-list', 'bank'));
    receiptUploadInput.addEventListener('change', (e) => handleFileUpload(e, 'uploaded-receipts-list', 'receipts'));

    analyzeButton.addEventListener('click', () => {
        const start = startDateInput.value;
        const end = endDateInput.value;

        if (!isEmailVerified && simulatedUploadedFiles.bank.length === 0 && simulatedUploadedFiles.receipts.length === 0) {
            alert("Please verify your email address or upload some files first."); return;
        }
        if (!start || !end) { alert("Please select both a start and end date for the analysis period."); return; }
        if (new Date(start) > new Date(end)) { alert("Start date cannot be after end date."); return; }

        console.log(`Simulating new analysis from ${start} to ${end}`);
        console.log("Using Email Verified:", isEmailVerified);
        console.log("Uploaded Bank Statements:", simulatedUploadedFiles.bank);
        console.log("Uploaded Receipts/Other:", simulatedUploadedFiles.receipts);

        // Simulate AI processing these sources...
        const newScanId = `analysis_${Date.now()}`;
        const newScanName = `Analysis (${start} to ${end})`;
        const newScanData = []; // In a real app, AI generates this based on inputs

        // *** AI SIMULATION PLACEHOLDER ***
        // Here, you would normally call a backend or WASM module.
        // For mock-up, we just create an empty period. You could potentially
        // copy some items from existing scans that fall in the date range,
        // or add hardcoded items based on uploaded file names if needed for demo.
        alert("AI Simulation: Processing email ("+isEmailVerified+") and "+(simulatedUploadedFiles.bank.length + simulatedUploadedFiles.receipts.length)+" uploaded files for "+start+" to "+end+".\n(Creating an empty analysis period for this mock-up).");


        pseudoPastScans.unshift({ id: newScanId, name: newScanName });
        pseudoPastScansDataStore[newScanId] = newScanData; // Store empty array for now

        activeScanId = newScanId;
        showView('results'); // Switch to results view

        // Reset simulated uploads for next analysis run
        simulatedUploadedFiles = { bank: [], receipts: [] };
        uploadedBankStatementsList.innerHTML = '<li class="placeholder">No bank statements uploaded yet.</li>';
        uploadedReceiptsList.innerHTML = '<li class="placeholder">No receipts or other documents uploaded yet.</li>';
    });

    // Navigation & Global Controls
    homeButton.addEventListener('click', (e) => { e.preventDefault(); showView('home'); });
    sidebarToggleButton.addEventListener('click', toggleSidebar);
    pastScansList.addEventListener('click', handlePastScanClick);

    // Results View Controls
    deductionsTableBody.addEventListener('click', handleTableCellClick);
    deductionsTableBody.addEventListener('dblclick', handleTableCellDoubleClick);
    undoButton.addEventListener('click', performUndo);
    exportExcelBtn.addEventListener('click', exportToExcel);
    downloadSourcesBtn.addEventListener('click', downloadSourceDocuments); // Listener for renamed button


    // --- Initial Application Setup ---
    function initializeApp() {
        initializePseudoData();
        updateEmailStatusUI(); // Set initial email status & analyze button state
        showView('home');
        updateUndoButton();

        const today = new Date();
        const startOfYear = `${today.getFullYear()}-01-01`;
        startDateInput.value = startOfYear;
        endDateInput.value = today.toISOString().split('T')[0];

        console.log("Tax Deduct Tracker Mockup Initialized");
    }

    initializeApp();

});