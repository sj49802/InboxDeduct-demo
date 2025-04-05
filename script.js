document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const body = document.body;
    const appContainer = document.querySelector('.app-container');
    const homeButton = document.getElementById('home-button');
    const sidebarToggleButton = document.getElementById('sidebar-toggle-btn');
    const sidebarCloseButton = document.getElementById('sidebar-close-btn');
    const sidebar = document.getElementById('app-sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const mainLayout = document.getElementById('main-layout');
    const mainContent = document.getElementById('main-content');
    const pastScansList = document.getElementById('past-scans-list'); // Represents "Analysis Periods"

    // Home View
    const homeView = document.getElementById('home-view');
    const mainTitle = document.getElementById('main-title');
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
    const analyzeButton = document.getElementById('analyze-button');

    // Analysis Results View
    const scanResultsView = document.getElementById('scan-results-view');
    const scanTitle = document.getElementById('scan-title');
    const undoButton = document.getElementById('undo-button');
    const undoCountSpan = document.getElementById('undo-count');
    const exportExcelBtn = document.getElementById('export-excel-btn');
    const downloadSourcesBtn = document.getElementById('download-sources-btn');
    const deductionsTableBody = document.querySelector('#deductions-table tbody');
    const detailsPanel = document.getElementById('source-details-panel');
    const detailHeader = document.getElementById('detail-header');
    const detailContent = document.getElementById('detail-content');
    const detailAttachmentsList = document.getElementById('detail-attachments-list');


    // --- State ---
    let isEmailVerified = false;
    let activeScanId = null;
    let currentScanData = [];
    let pseudoPastScans = [];
    let pseudoPastScansDataStore = {};
    let simulatedUploadedFiles = { bank: [], receipts: [] };
    let selectedRowElement = null;
    let nextRowId = 1;
    const MAX_UNDO_STEPS = 10;
    let undoStack = [];
    let isSidebarOpen = false; // Track sidebar state for mobile

    // --- Pseudo Data (Mock Backend & AI Simulation) - Unchanged from original ---
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
    const pseudoFileData = {
        "bank_statement_jan25.pdf": { type: "Bank Statement", content_summary: "Contains various transactions including:\n- Transfer to Savings: $500\n- Payment: AWS Services $75.50 (Jan 15)\n- Deposit: Client Payment $1200" },
        "bank_statement_feb25.pdf": { type: "Bank Statement", content_summary: "Contains transactions like:\n- Payment: Adobe Creative Cloud $52.99 (Feb 5)\n- Withdrawal: ATM $100\n- Payment: Office Lease $850 (Feb 1)" },
        "staples_receipt_feb18.pdf": { type: "Receipt", content_summary: "Items:\n- Printer Paper: $12.99\n- Pens (Box): $8.50\nTotal: $21.49" },
        "health_insurance_q1.pdf": { type: "Insurance Statement", content_summary: "Quarterly Premium: $650.00\nPeriod: Jan 1 - Mar 31, 2025" },
        "investment_summary_2025.csv": { type: "Investment Summary", content_summary: "Trade History:\n- BUY AAPL 10 shares @ $170 (Jan 20)\n- SELL GOOG 5 shares @ $2800 (Mar 10)\nDividend Received: MSFT $35.00 (Feb 15)" }
    };

    function initializePseudoData() {
        pseudoPastScans = [
            { id: "scan1", name: "Q1 2025 Analysis" },
            { id: "scan2", name: "Recent Expenses (Mar 2025)" }
        ];
        const initialScan1Data = [
            { rowId: 1, description: "Pro Tools Software Subscription", amount: 150.00, date: "2025-03-15", category: "Software", sourceType: "email", sourceRef: "msg_id_7a3b", attachment: "receipt_protools.pdf" },
            { rowId: 2, description: "Ergonomic Monitor Stand", amount: 45.50, date: "2025-02-20", category: "Office Supplies", sourceType: "email", sourceRef: "msg_id_9c1d", attachment: "invoice_monitor_stand.pdf" },
            { rowId: 3, description: "Train Ticket (Client Meeting)", amount: 85.00, date: "2025-01-10", category: "Travel", sourceType: "email", sourceRef: "msg_id_b2e8", attachment: "train_ticket_011025.jpg" },
            { rowId: 5, description: "Adv. JavaScript Course", amount: 499.00, date: "2025-01-28", category: "Professional Development", sourceType: "email", sourceRef: "msg_id_c4a1", attachment: "course_receipt_js.pdf" },
            { rowId: 7, description: "Client Dinner (Project Phoenix)", amount: 180.30, date: "2025-02-12", category: "Meals & Entertainment", sourceType: "email", sourceRef: "msg_id_a0d7", attachment: "client_dinner_feb12.png" },
            { rowId: 10, description: "AWS Services Payment", amount: 75.50, date: "2025-01-15", category: "Cloud Services", sourceType: "bank-statement", sourceRef: "bank_statement_jan25.pdf", attachment: null },
            { rowId: 11, description: "Adobe Creative Cloud", amount: 52.99, date: "2025-02-05", category: "Software", sourceType: "bank-statement", sourceRef: "bank_statement_feb25.pdf", attachment: null },
            { rowId: 12, description: "Office Lease Payment", amount: 850.00, date: "2025-02-01", category: "Rent/Lease", sourceType: "bank-statement", sourceRef: "bank_statement_feb25.pdf", attachment: null },
            { rowId: 13, description: "Office Supplies (Staples)", amount: 21.49, date: "2025-02-18", category: "Office Supplies", sourceType: "receipt-pdf", sourceRef: "staples_receipt_feb18.pdf", attachment: "staples_receipt_feb18.pdf" },
            { rowId: 14, description: "Health Insurance Premium Q1", amount: 650.00, date: "2025-03-31", category: "Insurance", sourceType: "insurance-pdf", sourceRef: "health_insurance_q1.pdf", attachment: "health_insurance_q1.pdf" },
            { rowId: 15, description: "MSFT Dividend Income", amount: -35.00, date: "2025-02-15", category: "Investment Income", sourceType: "investment-csv", sourceRef: "investment_summary_2025.csv", attachment: null },
        ];
        const initialScan2Data = [
             { rowId: 4, description: "Cloud Storage Service", amount: 25.00, date: "2025-03-01", category: "Utilities", sourceType: "email", sourceRef: "msg_id_f5a9", attachment: "cloud_storage_mar25.pdf" },
             { rowId: 6, description: "Domain Renewal mybusiness.example.com", amount: 15.99, date: "2025-03-05", category: "Web Hosting/Domains", sourceType: "email", sourceRef: "msg_id_e9b3", attachment: "domain_renewal_invoice_9876.pdf" },
             { rowId: 8, description: "Business Internet Bill", amount: 109.00, date: "2025-03-20", category: "Utilities", sourceType: "email", sourceRef: "msg_id_1123", attachment: "internet_bill_mar25.pdf" },
             { rowId: 9, description: "Lunch with Supplier XYZ", amount: 45.60, date: "2025-03-28", category: "Meals", sourceType: "email", sourceRef: "msg_id_5566", attachment: "lunch_mar28.jpg" },
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

    function updateEmailStatusUI() {
        if (isEmailVerified) {
            emailStatusIcon.className = 'fas fa-check-circle fa-3x status-icon-verified';
            emailStatusText.textContent = "VERIFIED";
            emailStatusText.className = 'verified';
            verifyEmailBtn.textContent = "Verified";
            verifyEmailBtn.disabled = true;
            verifyEmailBtn.classList.add('verified');
            emailInput.disabled = true;
            analyzeButton.disabled = false; // Enable Analyze if verified
        } else {
            emailStatusIcon.className = 'fas fa-envelope fa-3x status-icon-unverified';
            emailStatusText.textContent = "NOT VERIFIED";
            emailStatusText.className = 'unverified';
            verifyEmailBtn.textContent = "Verify";
            verifyEmailBtn.disabled = false;
            verifyEmailBtn.classList.remove('verified');
            emailInput.disabled = false;
            // Disable analyze only if BOTH email not verified AND no files uploaded
            analyzeButton.disabled = !(simulatedUploadedFiles.bank.length > 0 || simulatedUploadedFiles.receipts.length > 0);
        }
    }

    function showView(viewToShow) {
        homeView.style.display = 'none';
        scanResultsView.style.display = 'none';
        homeButton.classList.remove('active');
        // Close mobile sidebar when changing views
        if (isSidebarOpen) closeMobileSidebar();

        if (viewToShow === 'home') {
            homeView.style.display = 'block';
            mainTitle.style.display = 'block'; // Show generic home title
            scanTitle.style.display = 'none'; // Hide results title
            homeButton.classList.add('active');
            activeScanId = null;
            currentScanData = [];
            undoStack = [];
            updateUndoButton();
            resetDetailsPanel();
            renderPastScans(); // Clear active state in sidebar
            mainContent.scrollTop = 0; // Scroll to top
        } else if (viewToShow === 'results') {
            scanResultsView.style.display = 'flex'; // Use flex for vertical layout control
            mainTitle.style.display = 'none'; // Hide generic home title
            scanTitle.style.display = 'block'; // Show results title

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
            undoStack = [];
            updateUndoButton();
            resetDetailsPanel();
            renderPastScans(); // Highlight active scan
            mainContent.scrollTop = 0; // Scroll to top
        }
    }

    // --- Sidebar Toggle Logic (Enhanced for Mobile) ---

    function openMobileSidebar() {
        if (isSidebarOpen) return;
        sidebar.classList.add('open');
        sidebarOverlay.classList.add('visible');
        sidebarToggleButton.setAttribute('aria-expanded', 'true');
        sidebar.setAttribute('aria-hidden', 'false');
        body.classList.add('sidebar-open'); // Prevent body scroll
        isSidebarOpen = true;
    }

    function closeMobileSidebar() {
        if (!isSidebarOpen) return;
        sidebar.classList.remove('open');
        sidebarOverlay.classList.remove('visible');
        sidebarToggleButton.setAttribute('aria-expanded', 'false');
        sidebar.setAttribute('aria-hidden', 'true');
        body.classList.remove('sidebar-open');
        isSidebarOpen = false;
    }

    function toggleDesktopSidebar() {
        mainLayout.classList.toggle('sidebar-collapsed');
        // Persist state? Maybe using localStorage if needed
    }

    function handleSidebarToggle() {
        const isMobile = window.innerWidth < 768; // Match CSS breakpoint
        if (isMobile) {
            if (isSidebarOpen) {
                closeMobileSidebar();
            } else {
                openMobileSidebar();
            }
        } else {
            toggleDesktopSidebar();
        }
    }

    // --- Autosave & Undo Logic (Unchanged) ---
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
                    // Ensure insertion at the correct original index
                    currentScanData.splice(action.index, 0, action.data);
                    needsRerender = true;
                    break;
                case 'edit':
                     const editIndex = currentScanData.findIndex(item => String(item.rowId) === String(action.rowId));
                     if (editIndex > -1) {
                         currentScanData[editIndex][action.field] = action.oldValue;
                         needsRerender = true;
                     } else {
                          console.warn("Undo failed: Could not find rowId", action.rowId, "for edit action.");
                     }
                    break;
                default:
                    console.error("Unknown undo action type:", action.type);
                    updateUndoButton();
                    return;
            }

            autoSaveChanges();

            if (needsRerender) {
                 renderDeductionsTable(currentScanData);
                 // Re-select row or reset panel after undo
                 let rowToReselect = null;
                 if (action.rowId) {
                    rowToReselect = deductionsTableBody.querySelector(`tr[data-row-id="${action.rowId}"]`);
                 }

                 if (rowToReselect) {
                     selectTableRow(rowToReselect);
                     // Optional: Scroll the reselected row into view
                     rowToReselect.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                 } else {
                     resetDetailsPanel(); // Reset details if row not found or action was delete
                 }
            }

        } catch (error) {
            console.error("Error during undo operation:", error);
             renderDeductionsTable(currentScanData); // Attempt re-render on error
        }

        updateUndoButton();
        console.log("Undo complete.");
    }

     // --- Helpers (Source Type, Formatting) - Unchanged ---
    function getSourceTypeInfo(sourceType) {
        switch(sourceType?.toLowerCase()) {
            case 'email':           return { icon: 'fa-envelope', label: 'Email', color: '#007bff' };
            case 'receipt-pdf':     return { icon: 'fa-file-invoice-dollar', label: 'Receipt PDF', color: '#198754' }; // Updated green
            case 'bank-statement':  return { icon: 'fa-landmark', label: 'Bank Stmt', color: '#0dcaf0' }; // Updated info blue
            case 'insurance-pdf':   return { icon: 'fa-file-shield', label: 'Ins PDF', color: '#fd7e14' }; // Orange
            case 'investment-csv':  return { icon: 'fa-file-csv', label: 'Invest CSV', color: '#6f42c1' }; // Purple
            case 'manual':          return { icon: 'fa-pencil', label: 'Manual', color: '#6c757d' };
            default:                return { icon: 'fa-question-circle', label: 'Unknown', color: '#dc3545' };
        }
    }
    function formatCellContent(field, value, item = null) {
        if (value === null || typeof value === 'undefined' || value === '') return '---';
        switch(field) {
            case 'amount':
                const numValue = Number(value);
                return isNaN(numValue) ? '$0.00' : `$${numValue.toFixed(2)}`;
            case 'attachment':
                 // Use shorter display on mobile if needed, but keep full name in data-attribute
                 const shortValue = value.length > 15 ? value.substring(0, 12) + '...' : value;
                 return value ? `<a href="#" class="attachment-link" data-attachment="${value}" title="Simulate opening ${value}"><i class="fas fa-link"></i> ${shortValue}</a>` : '---';
            case 'date':
                try {
                    // Ensure date is treated as UTC to avoid timezone shifts
                    const dt = new Date(value + 'T00:00:00Z');
                    return dt.toLocaleDateString('en-CA'); // YYYY-MM-DD is good for sorting/consistency
                } catch (e) { return value; }
            case 'sourceType':
                const typeInfo = getSourceTypeInfo(value);
                return `<i class="fas ${typeInfo.icon}" style="color:${typeInfo.color};" title="${typeInfo.label}"></i>`;
            case 'sourceRef':
                 const shortRef = String(value).length > 15 ? String(value).substring(0, 12) + '...' : String(value);
                 return `<span title="${value}">${shortRef}</span>`; // Show full ref on hover
            default: // Description, Category
                return String(value);
        }
    }

    // --- Table Rendering and Interaction ---
    function renderDeductionsTable(deductions) {
        deductionsTableBody.innerHTML = '';
        if (!deductions || deductions.length === 0) {
            deductionsTableBody.innerHTML = `<tr class="placeholder"><td colspan="8">No potential deductions found for this analysis period.</td></tr>`;
            return;
        }

        deductions.forEach(item => {
            const row = document.createElement('tr');
            row.dataset.rowId = item.rowId;
            row.dataset.sourceType = item.sourceType;
            row.dataset.sourceRef = item.sourceRef;
            row.tabIndex = 0; // Make row focusable for accessibility/keyboard nav

            const editableFields = ['description', 'amount', 'date', 'category'];

            row.innerHTML = `
                <td class="col-desc ${editableFields.includes('description') ? 'editable' : ''}" data-field="description">${formatCellContent('description', item.description, item)}</td>
                <td class="col-amount ${editableFields.includes('amount') ? 'editable' : ''}" data-field="amount">${formatCellContent('amount', item.amount, item)}</td>
                <td class="col-date ${editableFields.includes('date') ? 'editable' : ''}" data-field="date">${formatCellContent('date', item.date, item)}</td>
                <td class="col-cat ${editableFields.includes('category') ? 'editable' : ''}" data-field="category">${formatCellContent('category', item.category, item)}</td>
                <td class="col-source-type source-type-cell" data-field="sourceType">${formatCellContent('sourceType', item.sourceType, item)}</td>
                <td class="col-source-ref" data-field="sourceRef">${formatCellContent('sourceRef', item.sourceRef, item)}</td>
                <td class="col-attach" data-field="attachment">${formatCellContent('attachment', item.attachment, item)}</td>
                <td class="col-actions actions-cell">
                    <button class="icon-button delete-row-btn" title="Delete Row" aria-label="Delete deduction row"><i class="fas fa-trash-alt"></i></button>
                </td>
            `;
            deductionsTableBody.appendChild(row);
        });

        // Re-apply selection visual state smoothly
        if (selectedRowElement) {
            const selectedRowId = selectedRowElement.dataset.rowId;
             const stillExists = currentScanData.some(item => String(item.rowId) === selectedRowId);
             if (stillExists) {
                  const reselectRow = deductionsTableBody.querySelector(`tr[data-row-id="${selectedRowId}"]`);
                  if (reselectRow) {
                       reselectRow.classList.add('selected');
                       selectedRowElement = reselectRow;
                  } else { selectedRowElement = null; resetDetailsPanel(); } // Row vanished somehow
             } else {
                  selectedRowElement = null;
                  resetDetailsPanel(); // Row deleted
             }
        } else {
             resetDetailsPanel(); // No row selected
        }
    }

    function handleTableCellClick(event) {
        const target = event.target;
        const cell = target.closest('td');
        const row = target.closest('tr');

        if (!row || !row.dataset.rowId || row.classList.contains('placeholder')) return;

        const rowId = row.dataset.rowId;

        if (target.closest('.delete-row-btn')) {
            deleteTableRow(rowId); return;
        }
        if (target.closest('.attachment-link')) {
            event.preventDefault();
            const attachmentName = target.closest('.attachment-link').dataset.attachment;
            alert(`Simulating opening attachment: ${attachmentName}\n(This is a mock-up action)`);
            return;
        }
        // Row selection (allow selecting anywhere in row except action buttons)
        if (cell && !cell.classList.contains('actions-cell')) {
             selectTableRow(row);
             // On mobile, scroll details into view after selection
             if (window.innerWidth < 768) {
                 detailsPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
             }
        }
     }

    function handleTableCellDoubleClick(event) {
        // Allow double-click editing on non-touch devices or larger screens
        // On touch devices, rely on tap selection + potentially an edit button later if needed
        if ('ontouchstart' in window && window.innerWidth < 1024) return;

        const cell = event.target.closest('td');
        if (!cell || !cell.classList.contains('editable') || cell.classList.contains('editing')) return;
        makeCellEditable(cell);
     }

    // Make cell editable - minor tweak for input height consistency
    function makeCellEditable(cell) {
        if (cell.classList.contains('editing')) return;

        const row = cell.closest('tr');
        const rowId = row.dataset.rowId;
        const field = cell.dataset.field;
        const dataIndex = currentScanData.findIndex(item => String(item.rowId) === rowId);
        if (dataIndex === -1) { console.error("Cannot edit: Row data not found."); return; }

        const originalValue = currentScanData[dataIndex][field];
        const originalFormattedContent = cell.innerHTML;

        let inputType = 'text';
        let step = null;
        if (field === 'amount') { inputType = 'number'; step = '0.01'; }
        else if (field === 'date') { inputType = 'date'; }

        cell.classList.add('editing');
        cell.innerHTML = ''; // Clear cell content

        const input = document.createElement('input');
        input.type = inputType;
        if (step) input.step = step;
        input.className = 'edit-input';
        // Use originalValue for date, handle potential null/undefined
        input.value = (inputType === 'date')
            ? (originalValue ? String(originalValue).split('T')[0] : '')
            : (originalValue ?? ''); // Use nullish coalescing for other types

        cell.appendChild(input);
        input.focus();
        // Avoid selecting text in date inputs
        if (input.select && inputType !== 'date') {
            // Need slight delay for focus to register before select
            setTimeout(() => input.select(), 0);
        }

        // Blur handler needs to be robust against immediate re-clicks
        let saving = false;
        const handleEditEnd = (saveChange) => {
            if (saving) return; // Prevent double execution
            saving = true;

            input.removeEventListener('blur', handleBlur);
            input.removeEventListener('keydown', handleKeyDown);

            const newValueRaw = input.value;
            let newValue = newValueRaw;
            let isValid = true;

            if (field === 'amount') {
                newValue = parseFloat(newValueRaw);
                if (isNaN(newValue)) {
                     // Don't alert immediately on blur, allow potential correction
                     // alert("Invalid amount. Please enter a number.");
                     isValid = false;
                     newValue = originalValue; // Revert on invalid number
                }
            } else if (field === 'date') {
                // Allow empty date, but validate format if not empty
                 if (newValueRaw && !/^\d{4}-\d{2}-\d{2}$/.test(newValueRaw)) {
                    alert("Invalid date format. Please use YYYY-MM-DD."); isValid = false;
                 } else if (!newValueRaw) {
                    newValue = null; // Store empty date as null
                 } else {
                    newValue = newValueRaw;
                 }
            } else { // Description, Category
                newValue = newValueRaw.trim();
                 if (field === 'description' && !newValue) {
                    alert("Description cannot be empty."); isValid = false;
                 }
            }

            cell.classList.remove('editing');

            if (saveChange && isValid && newValue !== originalValue) {
                 console.log(`Saving edit: rowId=${rowId}, field=${field}, oldValue=${originalValue}, newValue=${newValue}`);
                 pushUndoAction({ type: 'edit', rowId: rowId, field: field, oldValue: originalValue, newValue: newValue });
                 currentScanData[dataIndex][field] = newValue;
                 autoSaveChanges();
                 cell.innerHTML = formatCellContent(field, newValue, currentScanData[dataIndex]);
                 // Update details panel if the selected row was edited
                 if (selectedRowElement && selectedRowElement.dataset.rowId === rowId) {
                     selectTableRow(row); // Re-select to update details
                 }
            } else {
                 cell.innerHTML = originalFormattedContent; // Revert display
            }
            // Ensure cell content doesn't cause overflow after edit
            cell.style.whiteSpace = (field === 'description' ? 'normal' : 'nowrap');
            saving = false;
        };

        const handleBlur = (e) => {
            // Don't save on blur if relatedTarget is part of the same row or editing UI (though input is removed)
             setTimeout(() => {
                 if (!cell.contains(document.activeElement)) {
                    handleEditEnd(true);
                 }
            }, 100); // Short delay allows Enter/Escape to process first
        };
        const handleKeyDown = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                input.blur(); // Trigger blur logic to save
            } else if (e.key === 'Escape') {
                e.preventDefault();
                handleEditEnd(false); // Cancel edit
            } else if (e.key === 'Tab') {
                // Allow tabbing out - blur will handle save
                // Add logic here if you want specific tab navigation behavior
            }
        };

        input.addEventListener('blur', handleBlur);
        input.addEventListener('keydown', handleKeyDown);
        // Ensure cell reverts to original wrap state if needed
        cell.style.whiteSpace = 'normal';
    }

    // Select table row and update details panel (Unchanged logic, CSS handles layout)
    function selectTableRow(rowElement) {
         if (!rowElement || !rowElement.dataset || !rowElement.dataset.rowId) {
            console.warn("Attempted to select an invalid row element.");
            return;
        }
         // Deselect previous row
         if (selectedRowElement && selectedRowElement !== rowElement) {
            selectedRowElement.classList.remove('selected');
        }

        // Select new row
        rowElement.classList.add('selected');
        selectedRowElement = rowElement;

        const rowId = rowElement.dataset.rowId;
        const deductionData = currentScanData.find(d => String(d.rowId) === rowId);

        if (!deductionData) {
            console.error("Data not found for selected row:", rowId);
            resetDetailsPanel();
            return;
        }

        const sourceType = deductionData.sourceType;
        const sourceRef = deductionData.sourceRef;
        const typeInfo = getSourceTypeInfo(sourceType);

        // Update Header
        detailHeader.innerHTML = `
            <i class="fas ${typeInfo.icon}" style="color:${typeInfo.color};"></i> ${typeInfo.label} Details
            <span class="detail-source-info" title="${sourceRef || ''}">Ref: ${formatCellContent('sourceRef', sourceRef)}</span>
        `;

        // Update Content
        let contentHTML = `<p class="placeholder-text">Details simulation.</p>`; // Default
        if (sourceType === 'email' && pseudoEmails[sourceRef]) {
            const emailData = pseudoEmails[sourceRef];
            contentHTML = `<strong>Subject:</strong> ${emailData.subject || '(No Subject)'}<br><hr>${emailData.body || '(No Body Content)'}`;
        } else if (pseudoFileData[sourceRef]) {
             const fileData = pseudoFileData[sourceRef];
             contentHTML = `<strong>File:</strong> ${sourceRef}<br>`;
             contentHTML += `<strong>Type:</strong> ${fileData.type}<br><hr>`;
             contentHTML += `<strong>Simulated Summary:</strong>\n${fileData.content_summary || '(No summary)'}`;
        } else if (sourceType === 'manual') {
             contentHTML = `<p>This entry was added or last modified manually.</p>`;
        } else if (sourceRef) {
            contentHTML = `<p>Details for source reference '${sourceRef}' are not available in this simulation.</p>`;
        }
        detailContent.innerHTML = contentHTML;

        // Update Attachments
        detailAttachmentsList.innerHTML = '';
        let attachmentsToShow = [];
        if (sourceType === 'email' && pseudoEmails[sourceRef]?.attachments?.length > 0) {
             attachmentsToShow = pseudoEmails[sourceRef].attachments;
        } else if (deductionData.attachment && deductionData.attachment !== sourceRef) {
             // Show specific attachment if different from source ref
             attachmentsToShow = [deductionData.attachment];
             // If sourceRef is a file, show it too?
             if (sourceRef && pseudoFileData[sourceRef]) {
                 attachmentsToShow.push(sourceRef + " (Source)");
             }
        } else if (sourceRef && pseudoFileData[sourceRef]) {
             // If sourceRef is a file and no other attachment, list the source file
             attachmentsToShow = [sourceRef];
        } else if (deductionData.attachment) { // Catch-all for attachment if no source ref logic applied
            attachmentsToShow = [deductionData.attachment];
        }

        if (attachmentsToShow.length > 0) {
            attachmentsToShow.forEach(att => {
                if (!att) return;
                const li = document.createElement('li');
                const isSource = att.endsWith(" (Source)");
                const cleanAtt = isSource ? att.replace(" (Source)", "") : att;
                const iconClass = isSource ? "fa-file-lines" : "fa-paperclip";
                li.innerHTML = `<i class="fas ${iconClass}"></i> <a href="#" class="attachment-link" data-attachment="${cleanAtt}" title="Simulate opening ${cleanAtt}">${cleanAtt}</a>`;
                detailAttachmentsList.appendChild(li);
            });
        } else {
            detailAttachmentsList.innerHTML = '<li>No related files found</li>';
        }
    }

    // Delete row (Unchanged logic)
    function deleteTableRow(rowId) {
         const rowIndex = currentScanData.findIndex(item => String(item.rowId) === String(rowId));
         if (rowIndex === -1) { console.warn("Delete failed: Row not found", rowId); return; }

         const rowElement = deductionsTableBody.querySelector(`tr[data-row-id="${rowId}"]`);
         const description = rowElement ? rowElement.cells[0].textContent : `Row ID ${rowId}`;

         if (confirm(`Delete deduction "${description}"?\nThis can be undone temporarily.`)) {
             const deletedData = { ...currentScanData[rowIndex] };
             pushUndoAction({ type: 'delete', index: rowIndex, data: deletedData });
             currentScanData.splice(rowIndex, 1);
             autoSaveChanges();
             if (selectedRowElement && selectedRowElement.dataset.rowId == rowId) {
                 resetDetailsPanel();
                 selectedRowElement = null;
             }
             // Animate removal (optional)
             if(rowElement) {
                 rowElement.style.transition = 'opacity 0.3s ease-out';
                 rowElement.style.opacity = '0';
                 setTimeout(() => renderDeductionsTable(currentScanData), 300);
             } else {
                 renderDeductionsTable(currentScanData);
             }
             console.log("Deleted row:", deletedData);
         }
     }

    // Reset details panel (Unchanged logic)
    function resetDetailsPanel() {
        detailHeader.innerHTML = `<i class="fas fa-info-circle"></i> Details <span class="detail-source-info">Select Item</span>`;
        detailContent.innerHTML = '<p class="placeholder-text">Select an item from the table to view details.</p>';
        detailAttachmentsList.innerHTML = '<li>No item selected</li>';
        if(selectedRowElement) {
            selectedRowElement.classList.remove('selected');
            selectedRowElement = null;
        }
    }

    // --- Past Scans (Analysis Periods) Functionality ---
    function renderPastScans() {
        pastScansList.innerHTML = ''; // Clear existing
        if (pseudoPastScans.length === 0) {
             pastScansList.innerHTML = '<li class="placeholder">No analysis periods yet.</li>';
             return;
        }
        pseudoPastScans.forEach(scan => {
            const li = document.createElement('li');
            li.dataset.scanId = scan.id;
            if (scan.id === activeScanId) { li.classList.add('active-scan'); }
            li.innerHTML = `
                <span class="scan-name" title="Load Analysis: ${scan.name}">${scan.name}</span>
                <div class="scan-actions">
                    <button class="icon-button rename-scan-btn" title="Rename" aria-label="Rename analysis ${scan.name}"><i class="fas fa-pencil-alt"></i></button>
                    <button class="icon-button delete-scan-btn" title="Delete" aria-label="Delete analysis ${scan.name}"><i class="fas fa-trash-alt"></i></button>
                </div>
            `;
           pastScansList.appendChild(li);
        });
    }

    function handlePastScanClick(event) {
        const target = event.target;
        const listItem = target.closest('li');
        if (!listItem || !listItem.dataset.scanId || listItem.classList.contains('placeholder')) return;
        const scanId = listItem.dataset.scanId;

        if (target.classList.contains('scan-name')) {
            if (scanId !== activeScanId) { loadPastScan(scanId); }
             // Close mobile sidebar after selection
             if (isSidebarOpen) closeMobileSidebar();
        } else if (target.closest('.rename-scan-btn')) {
            renamePastScan(listItem);
        } else if (target.closest('.delete-scan-btn')) {
            deletePastScan(scanId, listItem);
        }
    }

    function loadPastScan(scanId) {
        console.log(`Loading analysis period: ${scanId}`);
        const scanInfo = pseudoPastScans.find(s => s.id === scanId);
        if (!scanInfo || !pseudoPastScansDataStore[scanId]) {
             console.error(`Analysis data or info not found for ID: ${scanId}`);
             alert(`Error: Could not load analysis ${scanId}.`);
             showView('home'); return;
        }
        activeScanId = scanId;
        showView('results');
    }

    function renamePastScan(listItem) {
        const scanId = listItem.dataset.scanId;
        const nameSpan = listItem.querySelector('.scan-name');
        const actionsDiv = listItem.querySelector('.scan-actions');
        const currentName = nameSpan.textContent;

        nameSpan.style.display = 'none';
        actionsDiv.style.display = 'none';

        const input = document.createElement('input');
        input.type = 'text'; input.value = currentName; input.className = 'rename-input';

        listItem.insertBefore(input, actionsDiv); // Insert input before actions
        input.focus(); input.select();

        const finalizeRename = (save) => {
             input.removeEventListener('blur', handleRenameBlur);
             input.removeEventListener('keydown', handleRenameKeydown);
             input.remove(); // Remove input field

             const newName = input.value.trim();
             if (save && newName && newName !== currentName) {
                 nameSpan.textContent = newName; nameSpan.title = `Load Analysis: ${newName}`;
                 const scanIndex = pseudoPastScans.findIndex(s => s.id === scanId);
                 if (scanIndex > -1) { pseudoPastScans[scanIndex].name = newName; }
                 // Update main title if this is the active scan
                 if(scanId === activeScanId) { scanTitle.textContent = `Analysis: ${newName}`; }
                 console.log(`Renamed analysis ${scanId} to ${newName}`);
             } else {
                // No change or cancelled, revert display
                nameSpan.textContent = currentName;
             }
             // Show name and actions again
             nameSpan.style.display = '';
             actionsDiv.style.display = '';
             // Re-render to ensure consistency? Optional.
             // renderPastScans();
        };
        const handleRenameBlur = () => setTimeout(() => finalizeRename(true), 150); // Delay to allow keydown first
        const handleRenameKeydown = (e) => {
            if (e.key === 'Enter') { e.preventDefault(); finalizeRename(true); }
            else if (e.key === 'Escape') { e.preventDefault(); finalizeRename(false); }
        };
        input.addEventListener('blur', handleRenameBlur);
        input.addEventListener('keydown', handleRenameKeydown);
    }

    function deletePastScan(scanId, listItem) {
        const scanName = listItem.querySelector('.scan-name').textContent;
        if (confirm(`DELETE Analysis Period?\n"${scanName}"\n\nThis cannot be undone.`)) {
             pseudoPastScans = pseudoPastScans.filter(s => s.id !== scanId);
             delete pseudoPastScansDataStore[scanId];
             listItem.remove(); // Remove from UI
             console.log(`Deleted analysis period: ${scanId}`);
             // If the deleted scan was active, go home
             if (scanId === activeScanId) {
                 alert("The active analysis period was deleted.");
                 showView('home');
             }
             // Check if list is now empty
             if (pseudoPastScans.length === 0) {
                 renderPastScans(); // Re-render to show placeholder
             }
        }
    }

    // --- Simulation & Export/Download ---

    function handleFileUpload(event, listElementId, fileType) {
        const listElement = document.getElementById(listElementId);
        const files = event.target.files;
        if (!files || files.length === 0) return;

        const placeholder = listElement.querySelector('.placeholder');
        if (placeholder) placeholder.remove();

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            // Simple duplicate check based on name for this session
            if (simulatedUploadedFiles[fileType].includes(file.name)) {
                console.log(`Skipping duplicate file: ${file.name}`);
                continue;
            }

            const listItem = document.createElement('li');
            const iconClass = file.name.toLowerCase().endsWith('.pdf') ? 'fa-file-pdf'
                            : file.name.toLowerCase().endsWith('.csv') ? 'fa-file-csv'
                            : (file.type.startsWith('image/')) ? 'fa-file-image'
                            : 'fa-file';
            listItem.innerHTML = `<i class="fas ${iconClass}"></i> <span>${file.name}</span>`; // Wrap name in span for potential styling/ellipsis
            listElement.appendChild(listItem);

            simulatedUploadedFiles[fileType].push(file.name);
            console.log(`Simulated upload of ${fileType}: ${file.name}`);
        }
        // Enable analyze button if files are uploaded
        analyzeButton.disabled = false;
        // Reset the input value to allow uploading the same file again if needed after removal (though we don't have removal UI yet)
        event.target.value = null;
    }

    function exportToExcel() { // Unchanged logic
         if (!currentScanData || currentScanData.length === 0) {
             alert("No data in the current view to export."); return;
         }
         console.log("Preparing data for Excel export...");
         const exportData = currentScanData.map(({ rowId, ...rest }) => ({
             Description: rest.description,
             Amount: rest.amount,
             Date: rest.date, // Excel usually handles dates well
             Category: rest.category,
             'Source Type': rest.sourceType,
             'Source Ref': rest.sourceRef,
             Attachment: rest.attachment
         }));

         try {
             const ws = XLSX.utils.json_to_sheet(exportData);
             // Auto-adjust column widths (basic estimation)
             const colWidths = Object.keys(exportData[0] || {}).map(key => {
                let maxLen = key.length; // Start with header length
                exportData.forEach(row => {
                    const cellValue = row[key];
                    const cellLen = cellValue ? String(cellValue).length : 0;
                    if (cellLen > maxLen) maxLen = cellLen;
                });
                // Add some padding, max width limit
                return { wch: Math.min(Math.max(maxLen, 10), 60) };
             });
             ws['!cols'] = colWidths;

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

    function downloadSourceDocuments() { // Unchanged logic
         if (!currentScanData || currentScanData.length === 0) {
             alert("No deductions loaded to fetch source documents for."); return;
         }
         console.log("Simulating download of source documents...");
         const sourceRefs = new Set();
         currentScanData.forEach(item => {
             if (item.sourceRef) sourceRefs.add(item.sourceRef);
             if (item.attachment) sourceRefs.add(item.attachment); // Add attachments too
         });

         if (sourceRefs.size === 0) {
             alert("No source references (emails or files) found."); return;
         }
         let summary = `--- Simulation: Download Source Documents ---\n\nWould attempt to package ${sourceRefs.size} unique items:\n`;
         sourceRefs.forEach(ref => {
             let type = pseudoEmails[ref] ? "Email" : pseudoFileData[ref] ? "File" : "Unknown";
             summary += `\n- Ref: ${ref} (Type: ${type})`;
         });
         summary += "\n\n--- End Simulation ---";
         console.log(summary);
         alert(`Simulation: ${sourceRefs.size} source documents identified for download.\nCheck console (F12).\n(Actual download needs server integration.)`);
     }

    // --- Event Listeners Setup ---

    // Global / Header
    homeButton.addEventListener('click', (e) => { e.preventDefault(); showView('home'); });
    sidebarToggleButton.addEventListener('click', handleSidebarToggle);
    sidebarCloseButton.addEventListener('click', closeMobileSidebar);
    sidebarOverlay.addEventListener('click', closeMobileSidebar); // Close sidebar when clicking overlay

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
            alert("Please verify email or upload files first."); return;
        }
        if (!start || !end) { alert("Please select a start and end date."); return; }
        if (new Date(start + 'T00:00:00Z') > new Date(end + 'T00:00:00Z')) { alert("Start date cannot be after end date."); return; }

        console.log(`Simulating analysis: ${start} to ${end}`);
        console.log("Email Verified:", isEmailVerified);
        console.log("Uploaded Bank:", simulatedUploadedFiles.bank);
        console.log("Uploaded Receipts:", simulatedUploadedFiles.receipts);

        // --- Simulation ---
        alert(`AI Simulation: Processing sources for ${start} to ${end}.\n(Creating a placeholder analysis period for this demo).`);
        const newScanId = `analysis_${Date.now()}`;
        const newScanName = `Analysis (${new Date(start+'T00:00:00Z').toLocaleDateString('en-US',{month:'short', day:'numeric'})} - ${new Date(end+'T00:00:00Z').toLocaleDateString('en-US',{month:'short', day:'numeric'})})`; // e.g., Analysis (Jan 01 - Mar 31)
        // For Demo: Add a few items based on sources (simple example)
        const newScanData = [];
        if (isEmailVerified) {
            // Add maybe one relevant email item if dates match
             const emailItem = pseudoPastScansDataStore["scan2"].find(item => item.sourceType === 'email' && item.date >= start && item.date <= end);
             if (emailItem) newScanData.push({ ...emailItem, rowId: nextRowId++ });
        }
        simulatedUploadedFiles.bank.forEach(fileName => {
            const fileItem = Object.values(pseudoPastScansDataStore).flat().find(item => item.sourceRef === fileName && item.date >= start && item.date <= end);
            if (fileItem) newScanData.push({ ...fileItem, rowId: nextRowId++ });
             else newScanData.push({ rowId: nextRowId++, description: `Data from ${fileName}`, amount: 0, date: end, category: 'Uncategorized', sourceType:'bank-statement', sourceRef: fileName, attachment: null });
        });
         simulatedUploadedFiles.receipts.forEach(fileName => {
             const fileItem = Object.values(pseudoPastScansDataStore).flat().find(item => item.sourceRef === fileName && item.date >= start && item.date <= end);
             if (fileItem) newScanData.push({ ...fileItem, rowId: nextRowId++ });
             else newScanData.push({ rowId: nextRowId++, description: `Data from ${fileName}`, amount: 0, date: end, category: 'Uncategorized', sourceType:'receipt-pdf', sourceRef: fileName, attachment: fileName });
        });
        // --- End Simulation ---

        pseudoPastScans.unshift({ id: newScanId, name: newScanName });
        pseudoPastScansDataStore[newScanId] = newScanData;

        activeScanId = newScanId;
        showView('results'); // Switch to results

        // Reset uploads
        simulatedUploadedFiles = { bank: [], receipts: [] };
        uploadedBankStatementsList.innerHTML = '<li class="placeholder">No bank statements yet.</li>';
        uploadedReceiptsList.innerHTML = '<li class="placeholder">No receipts/docs yet.</li>';
        updateEmailStatusUI(); // Re-evaluate analyze button state
    });

    // Sidebar List Interaction
    pastScansList.addEventListener('click', handlePastScanClick);

    // Results View Controls
    deductionsTableBody.addEventListener('click', handleTableCellClick);
    deductionsTableBody.addEventListener('dblclick', handleTableCellDoubleClick);
     // Add keydown listener to table body for selection navigation (optional enhancement)
    deductionsTableBody.addEventListener('keydown', (e) => {
        if (!selectedRowElement) return;
        let newRowToSelect = null;
        if (e.key === 'ArrowDown') {
            newRowToSelect = selectedRowElement.nextElementSibling;
            e.preventDefault();
        } else if (e.key === 'ArrowUp') {
            newRowToSelect = selectedRowElement.previousElementSibling;
             e.preventDefault();
        } else if (e.key === 'Enter' || e.key === ' ') {
             // Could trigger edit on Enter/Space if desired
             // const firstEditableCell = selectedRowElement.querySelector('.editable');
             // if (firstEditableCell) makeCellEditable(firstEditableCell);
             e.preventDefault();
        }

        if (newRowToSelect && newRowToSelect.dataset.rowId) {
            selectTableRow(newRowToSelect);
            newRowToSelect.focus(); // Focus the newly selected row
            // Scroll into view if needed
            newRowToSelect.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    });

    undoButton.addEventListener('click', performUndo);
    exportExcelBtn.addEventListener('click', exportToExcel);
    downloadSourcesBtn.addEventListener('click', downloadSourceDocuments);

    // --- Initial Application Setup ---
    function initializeApp() {
        initializePseudoData();
        updateEmailStatusUI();
        showView('home');
        updateUndoButton();

        // Set default dates (e.g., start of year to today)
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const startOfYear = `${year}-01-01`;
        const todayFormatted = `${year}-${month}-${day}`;

        startDateInput.value = startOfYear;
        endDateInput.value = todayFormatted;

        // Set initial sidebar state based on screen size (optional)
        if (window.innerWidth >= 768) {
           // Start with desktop sidebar open (or closed based on preference/localStorage)
           // mainLayout.classList.remove('sidebar-collapsed'); // Example: Start open
        } else {
            // Ensure mobile sidebar is closed initially
            closeMobileSidebar();
        }

        console.log("Tax Deduct Tracker Mobile-Friendly Mockup Initialized");
    }

    initializeApp();

});