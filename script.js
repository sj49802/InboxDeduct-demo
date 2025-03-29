document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const homeButton = document.getElementById('home-button'); // [cite: 1]
    const verifyEmailBtn = document.getElementById('verify-email-btn'); // [cite: 1]
    const emailInput = document.getElementById('email'); // [cite: 1]
    const startDateInput = document.getElementById('start-date'); // [cite: 1]
    const endDateInput = document.getElementById('end-date'); // [cite: 1]
    const emailStatusIcon = document.getElementById('email-status-icon'); // [cite: 1]
    const emailStatusText = document.getElementById('email-status-text'); // [cite: 1]
    const scanButton = document.getElementById('scan-button'); // [cite: 1]
    const pastScansList = document.getElementById('past-scans-list'); // [cite: 1]
    const sidebarToggleButton = document.getElementById('sidebar-toggle-btn'); // [cite: 1]
    const mainLayout = document.querySelector('.main-layout'); // [cite: 1]

    const homeView = document.getElementById('home-view'); // [cite: 2]
    const scanResultsView = document.getElementById('scan-results-view'); // [cite: 2]

    // Results View Elements
    const mainTitle = document.getElementById('main-title'); // [cite: 3]
    const scanTitle = document.getElementById('scan-title'); // [cite: 3]
    const undoButton = document.getElementById('undo-button'); // [cite: 3]
    const undoCountSpan = document.getElementById('undo-count'); // [cite: 4]
    const exportExcelBtn = document.getElementById('export-excel-btn'); // [cite: 4]
    const downloadEmailsBtn = document.getElementById('download-emails-btn'); // [cite: 4]
    // Add Row button DOM element removed
    const attachmentsList = document.getElementById('attachments-list'); // [cite: 4]
    const emailContent = document.getElementById('email-content'); // [cite: 5]
    const selectedEmailKeySpan = document.getElementById('selected-email-key'); // [cite: 5]
    const deductiblesTableBody = document.querySelector('#deductibles-table tbody'); // [cite: 5]

    // --- State ---
    let isEmailVerified = false; // [cite: 6]
    let activeScanId = null; // [cite: 6]
    let currentScanData = []; // Working copy [cite: 7]
    let pseudoPastScans = []; // Metadata { id, name } [cite: 8, 9]
    let pseudoPastScansDataStore = {}; // Data { scanId: [deductions] } [cite: 9, 10]
    let selectedRowElement = null; // [cite: 10]
    let nextRowId = 1; // Initialized properly in initializePseudoData [cite: 11]
    const MAX_UNDO_STEPS = 5; // Can adjust if needed, even without Add Row [cite: 11]
    let undoStack = []; // [cite: 12]

    // --- *** UPDATED & Expanded Pseudo Data *** ---
    const pseudoEmails = {
        "msg_id_7a3b": {
            subject: "Receipt for Software Subscription - Pro Tools Annual",
            body: "Dear John Doe,\n\nThank you for your continued subscription to Pro Tools Annual Plan.\nYour payment of $150.00 has been processed successfully on March 15, 2025.\n\nThis subscription provides access to all standard features and updates for the next 12 months.\n\nYour invoice is attached for your records (receipt_protools.pdf).\n\nRegards,\nThe Pro Tools Billing Team",
            attachments: ["receipt_protools.pdf"]
        }, // [cite: 20]
        "msg_id_9c1d": {
            subject: "Your Office Supplies Co. Order Confirmation #ORD-87651",
            body: "Hi John,\n\nYour order ORD-87651 has been confirmed.\n\nItem: Ergonomic Monitor Stand - Model X\nQuantity: 1\nPrice: $45.50\nDate: February 20, 2025\n\nExpected delivery: Feb 25-27.\nShipping details attached (shipping_details.txt).\nInvoice attached (invoice_monitor_stand.pdf).\n\nThanks for shopping with us!\nOffice Supplies Co.",
            attachments: ["invoice_monitor_stand.pdf", "shipping_details.txt"]
        }, // [cite: 20]
        "msg_id_b2e8": {
            subject: "Re: Travel Expense Approval - Client Meeting Jan 10",
            body: "Hi John,\n\nApproved. Please find attached the scanned receipt for the train ticket for your client meeting on January 10, 2025.\nAmount: $85.00\n\nPlease submit this with your expense report.\n\nBest,\nAdmin Support",
            attachments: ["train_ticket_011025.jpg"] // Adjusted date in filename
        }, // [cite: 20]
         "msg_id_f5a9": {
            subject: "FWD: Your Monthly Cloud Storage Invoice [Acme Cloud]",
            body: "---------- Forwarded message ---------\nFrom: Acme Cloud Billing <noreply@acmecloud.example>\nDate: Sat, Mar 1, 2025 at 8:00 AM\nSubject: Your Monthly Cloud Storage Invoice [Acme Cloud]\nTo: john.doe@example.com\n\nHi John,\n\nYour invoice for cloud storage services (Account #JD123) for February 2025 is now available.\nAmount Due: $25.00\nDue Date: March 15, 2025\n\nPlease see the attached PDF for details (cloud_storage_mar25.pdf).\n\nThanks,\nAcme Cloud",
            attachments: ["cloud_storage_mar25.pdf"] // Adjusted date in filename
        }, // [cite: 20]
        "msg_id_c4a1": {
            subject: "Receipt: Professional Development Course - Advanced JavaScript",
            body: "RECEIPT\n--------\nStudent: John Doe\nCourse: Advanced JavaScript Techniques\nDate: January 28, 2025\nAmount Paid: $499.00\nPayment Method: VISA **** 1234\n\nThank you for registering!\nOnline Learning Hub\n\nP.S. Course materials can be accessed via your portal.",
            attachments: ["course_receipt_js.pdf"]
        }, // New
        "msg_id_e9b3": {
            subject: "Your Domain Renewal - mybusiness.example.com",
            body: "Dear John Doe,\n\nThis email confirms the successful renewal of your domain name 'mybusiness.example.com' for one year.\nRenewal Date: March 5, 2025\nExpiry Date: March 5, 2026\nCost: $15.99 (charged to card on file **** 1234)\n\nInvoice #INV-DOM-9876 attached.\nNo action is required from your side.\n\nThank you for being a valued customer,\nDomain Registrar Inc.",
            attachments: ["domain_renewal_invoice_9876.pdf"]
        }, // New
        "msg_id_a0d7": {
            subject: "Client Dinner Expense - Project Phoenix",
            body: "Team,\n\nPlease find attached the receipt for the client dinner related to Project Phoenix on Feb 12, 2025.\nLocation: The Grand Restaurant\nAttendees: J. Doe, Client A (CEO, Globex Corp), Client B (CTO, Globex Corp)\nAmount: $180.30\n\nPurpose: Discussed project milestones, upcoming deliverables, and phase 2 planning.\n\nEnsure this is categorized correctly in the expense system.\n\nRegards,\nJohn",
            attachments: ["client_dinner_feb12.png"]
        }, // New
        "msg_id_1123": {
             subject: "Internet Bill - March 2025",
             body: "Account: JD-IBIZ\nService Period: 01 Mar 2025 - 31 Mar 2025\n\nBusiness Fiber 100/40 Plan: $99.00\nStatic IP Address: $10.00\nTotal Due: $109.00\n\nPayment will be automatically deducted on Mar 20, 2025.\n\nThank you,\nSpeedyNet ISP",
             attachments: ["internet_bill_mar25.pdf"]
        }, // New
         "msg_id_5566": {
             subject: "Lunch Meeting Receipt",
             body: "Receipt attached for lunch meeting with potential supplier (Supplier XYZ) today, Mar 28, 2025.\nAmount: $45.60\nPurpose: Initial discussion regarding bulk component pricing.",
             attachments: ["lunch_mar28.jpg"]
         }, // New
        "email_missing_ref": { // Example for items without a direct email link
             subject: "Unknown Email",
             body: "Email details not available for this automatically detected potential deduction.",
             attachments: []
        }, // [cite: 20]
        "manual_entry": {
            subject: "Manual Entry",
            body: "This deduction was added or modified manually in InboxDeduct.",
            attachments: []
        } // [cite: 20]
    };

    function initializePseudoData() { // [cite: 12]
        // *** UPDATED: More data added ***
        pseudoPastScans = [
            { id: "scan1", name: "Q1 2025 Deductions" },
            { id: "scan2", name: "Recent Expenses (Mar 2025)" }
        ]; // Based on [cite: 12]

        const initialScan1Data = [
            { rowId: 1, description: "Pro Tools Software Subscription", amount: 150.00, date: "2025-03-15", category: "Software", emailKey: "msg_id_7a3b", attachment: "receipt_protools.pdf" }, // [cite: 13]
            { rowId: 2, description: "Ergonomic Monitor Stand", amount: 45.50, date: "2025-02-20", category: "Office Supplies", emailKey: "msg_id_9c1d", attachment: "invoice_monitor_stand.pdf" }, // [cite: 13]
            { rowId: 3, description: "Train Ticket (Client Meeting)", amount: 85.00, date: "2025-01-10", category: "Travel", emailKey: "msg_id_b2e8", attachment: "train_ticket_011025.jpg" }, // [cite: 14]
             { rowId: 5, description: "Adv. JavaScript Course", amount: 499.00, date: "2025-01-28", category: "Professional Development", emailKey: "msg_id_c4a1", attachment: "course_receipt_js.pdf" }, // New
             { rowId: 7, description: "Client Dinner (Project Phoenix)", amount: 180.30, date: "2025-02-12", category: "Meals & Entertainment", emailKey: "msg_id_a0d7", attachment: "client_dinner_feb12.png" }, // New
        ];
        const initialScan2Data = [
             { rowId: 4, description: "Cloud Storage Service", amount: 25.00, date: "2025-03-01", category: "Utilities", emailKey: "msg_id_f5a9", attachment: "cloud_storage_mar25.pdf" }, // [cite: 15]
             { rowId: 6, description: "Domain Renewal mybusiness.example.com", amount: 15.99, date: "2025-03-05", category: "Web Hosting/Domains", emailKey: "msg_id_e9b3", attachment: "domain_renewal_invoice_9876.pdf" }, // New
             { rowId: 8, description: "Business Internet Bill", amount: 109.00, date: "2025-03-20", category: "Utilities", emailKey: "msg_id_1123", attachment: "internet_bill_mar25.pdf" }, // New
             { rowId: 9, description: "Lunch with Supplier XYZ", amount: 45.60, date: "2025-03-28", category: "Meals", emailKey: "msg_id_5566", attachment: "lunch_mar28.jpg" }, // New
             // Example of original data point from scan2 [cite: 15] kept for reference during merge/update if needed:
             // { rowId: 5, description: "Business Lunch", amount: 65.70, date: "2024-02-05", category: "Meals", emailKey: "email_missing_ref", attachment: "lunch_receipt.png" },
        ];

        pseudoPastScansDataStore = {
            "scan1": initialScan1Data.map(d => ({...d})),
            "scan2": initialScan2Data.map(d => ({...d}))
        }; // [cite: 16]

        // Recalculate nextRowId based on the updated data
        let maxId = 0;
        Object.values(pseudoPastScansDataStore).forEach(scanData => {
            scanData.forEach(item => { if (item.rowId > maxId) maxId = item.rowId; });
        }); // [cite: 18]
        nextRowId = maxId + 1; // [cite: 19]

        renderPastScans(); // [cite: 19]
    }


    // --- Functions ---

    function updateEmailStatusUI() { /* Based on*/
        if (isEmailVerified) {
            emailStatusIcon.className = 'fas fa-check-circle fa-4x status-icon-verified';
            emailStatusText.textContent = "EMAIL VERIFIED";
            emailStatusText.className = 'verified';
            verifyEmailBtn.textContent = "Verified";
            verifyEmailBtn.disabled = true;
            verifyEmailBtn.classList.add('verified');
            scanButton.disabled = false;
            emailInput.disabled = true;
        } else {
            emailStatusIcon.className = 'fas fa-envelope fa-4x status-icon-unverified';
            emailStatusText.textContent = "EMAIL NOT VERIFIED";
            emailStatusText.className = 'unverified';
            verifyEmailBtn.textContent = "Verify Email";
            verifyEmailBtn.disabled = false;
            verifyEmailBtn.classList.remove('verified');
            scanButton.disabled = true;
            emailInput.disabled = false;
        }
    }

    function showView(viewToShow) { /* Based on*/
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
            resetDetailsPanels();
        } else if (viewToShow === 'results') {
            scanResultsView.style.display = 'flex';
            mainTitle.style.display = 'none';
            if (activeScanId && pseudoPastScansDataStore[activeScanId]) {
                currentScanData = pseudoPastScansDataStore[activeScanId].map(item => ({ ...item }));
                renderDeductionsTable(currentScanData);
            } else {
                console.error("Attempted to show results view without a valid activeScanId or data.");
                scanTitle.textContent = "Error: Scan Data Not Found";
                currentScanData = [];
                renderDeductionsTable([]);
            }
            undoStack = []; // Clear undo stack on load
            updateUndoButton();
            resetDetailsPanels();
        }
    }

    // --- Autosave & Undo ---
    function autoSaveChanges() { /* Based on*/
        if (!activeScanId || !pseudoPastScansDataStore.hasOwnProperty(activeScanId)) {
            console.error("Autosave failed: No active scan ID or data store entry.");
            return;
        }
        pseudoPastScansDataStore[activeScanId] = currentScanData.map(item => ({ ...item }));
        console.log(`Autosaved data for scanId: ${activeScanId}`);
    }

    function pushUndoAction(action) { /* Based on*/
        undoStack.push(action);
        if (undoStack.length > MAX_UNDO_STEPS) {
            undoStack.shift();
        }
        updateUndoButton();
    }

    function updateUndoButton() { /* Based on*/
        const count = undoStack.length;
        undoCountSpan.textContent = count;
        undoButton.disabled = count === 0;
    }

    // --- *** REFINED Undo Logic *** ---
    function performUndo() { // Based on
        if (undoStack.length === 0 || !activeScanId) return;

        const action = undoStack.pop(); // [cite: 42]
        console.log("Attempting to undo:", action);
        let needsRerender = false; // Flag to ensure re-render happens [cite: 42]

        try {
             switch (action.type) { // [cite: 43]
                case 'delete': // Reverse of delete is add [cite: 44]
                    // Re-insert data into working copy at original index
                    currentScanData.splice(action.index, 0, action.data); // [cite: 44]
                    needsRerender = true; // [cite: 44]
                    break;
                // 'add' case REMOVED
                case 'edit': // [cite: 49]
                     const editIndex = currentScanData.findIndex(item => item.rowId === action.rowId); // [cite: 49]
                     if (editIndex > -1) { // [cite: 50]
                         // Revert data in the working copy
                         currentScanData[editIndex][action.field] = action.oldValue; //
                         // Set flag to re-render, removing direct DOM manipulation [cite: 57]
                         needsRerender = true; // MODIFICATION: Ensure re-render happens
                     } else {
                          console.warn("Undo failed: Could not find rowId", action.rowId, "in currentScanData for edit action.");
                          needsRerender = true; // Re-render anyway
                     }
                    break;
                default:
                    console.error("Unknown undo action type:", action.type);
                    updateUndoButton();
                    return;
            }

            // Autosave the reverted state BEFORE re-rendering [cite: 58]
            autoSaveChanges();

            // Always re-render the table from the reverted `currentScanData` if needed [cite: 60]
            if (needsRerender) {
                 renderDeductionsTable(currentScanData);
            }

        } catch (error) {
            console.error("Error during undo operation:", error);
             // Attempt to re-render in case of error to sync UI
             renderDeductionsTable(currentScanData);
        }

        updateUndoButton(); // [cite: 61]
        console.log("Undo complete."); // [cite: 61]
    }


     // Helper to format cell content
    function formatCellContent(field, value) { // Based on
        if (value === null || typeof value === 'undefined') return '';

        if (field === 'amount') {
            const numValue = Number(value);
            return isNaN(numValue) ? '$0.00' : `$${numValue.toFixed(2)}`;
        } else if (field === 'attachment' && value) {
            return `<a href="#" class="attachment-link" data-attachment="${value}">${value}</a>`;
        } else {
            // Includes description, date, category, emailKey
            return value;
        }
    }

    // --- Table Rendering and Editing ---
    function renderDeductionsTable(deductions) { // Based on
        deductiblesTableBody.innerHTML = '';
        if (!deductions || deductions.length === 0) {
            deductiblesTableBody.innerHTML = '<tr><td colspan="7">No deductions found or loaded.</td></tr>';
            return;
        }

        deductions.forEach(item => {
            const row = document.createElement('tr');
            row.dataset.rowId = item.rowId;
            row.dataset.emailKey = item.emailKey;

            // MODIFIED: Added 'editable' and specific classes to Description and Date cells
            row.innerHTML = `
                <td data-field="description" class="editable description-cell">${formatCellContent('description', item.description)}</td>
                <td data-field="amount" class="editable amount-cell">${formatCellContent('amount', item.amount)}</td>
                <td data-field="date" class="editable date-cell">${formatCellContent('date', item.date)}</td>
                <td data-field="category" class="editable category-cell">${formatCellContent('category', item.category)}</td>
                <td data-field="emailKey">${formatCellContent('emailKey', item.emailKey)}</td>
                <td data-field="attachment">${formatCellContent('attachment', item.attachment)}</td>
                <td class="actions-cell">
                    <button class="icon-button delete-row-btn" title="Delete Row"><i class="fas fa-trash-alt"></i></button>
                </td>
            `;
            deductiblesTableBody.appendChild(row);
        });

        // Re-apply selection visual state
        if (selectedRowElement) {
            const selectedRowId = selectedRowElement.dataset.rowId;
             const stillExists = currentScanData.some(item => item.rowId == selectedRowId);
             if (stillExists) {
                  const reselectRow = deductiblesTableBody.querySelector(`tr[data-row-id="${selectedRowId}"]`);
                  if (reselectRow) {
                       reselectRow.classList.add('selected');
                       selectedRowElement = reselectRow;
                  } else { selectedRowElement = null; }
             } else {
                  selectedRowElement = null;
                  resetDetailsPanels();
             }
        } else {
             resetDetailsPanels();
        }
    }

    function handleTableCellClick(event) { /* Based on*/
         const target = event.target;
        const cell = target.closest('td');
        const row = target.closest('tr');

        if (!cell || !row || cell.classList.contains('editing')) return;

        const rowId = row.dataset.rowId;
        const isActionCell = cell.classList.contains('actions-cell');
        const isAttachmentLink = target.closest('.attachment-link');

        if (!isActionCell && !isAttachmentLink) {
             selectTableRow(row);
        }

        if (target.closest('.delete-row-btn')) {
            deleteTableRow(rowId);
        }
        if (isAttachmentLink) {
            event.preventDefault();
            const attachmentName = target.closest('.attachment-link').dataset.attachment;
            alert(`Simulating opening attachment: ${attachmentName}`);
        }
     }

    function handleTableCellDoubleClick(event) { /* Based on [cite: 85] */
        const cell = event.target.closest('td');
        // MODIFIED: Ensure target cell has 'editable' class
        if (!cell || !cell.classList.contains('editable') || cell.classList.contains('editing')) return;
        makeCellEditable(cell);
     }

    // --- *** REFINED Edit Logic *** ---
    function makeCellEditable(cell) { // Based on
        if (cell.classList.contains('editing')) return;

        const row = cell.closest('tr');
        const rowId = row.dataset.rowId;
        const field = cell.dataset.field; // Now includes 'description', 'date'
        const dataIndex = currentScanData.findIndex(item => item.rowId == rowId);
        if (dataIndex === -1) return;

        const originalValue = currentScanData[dataIndex][field];

        // MODIFIED: Determine input type based on field
        let inputType = 'text'; // Default for description, category
        let step = null;
        if (field === 'amount') { inputType = 'number'; step = '0.01'; }
        else if (field === 'date') { inputType = 'date'; } // Use date input type

        cell.dataset.originalContent = cell.innerHTML;
        cell.classList.add('editing');

        const input = document.createElement('input');
        input.type = inputType;
        if (step) input.step = step;
        input.className = 'edit-input';
        // Ensure date value is in YYYY-MM-DD format for input type=date
        input.value = (field === 'date' && originalValue) ? String(originalValue).split('T')[0] : originalValue;

        cell.innerHTML = '';
        cell.appendChild(input);
        input.focus();
        if (input.select && inputType !== 'date') input.select(); // Select text if not date input

        // --- Event listeners for the input ---
        const handleEditEnd = (saveChange) => {
            input.removeEventListener('blur', handleBlur);
            input.removeEventListener('keydown', handleKeyDown);

            const newValueRaw = input.value;
            let newValue = newValueRaw;
            let isValid = true;

            // Validation & Type Conversion per field
            if (field === 'amount') {
                newValue = parseFloat(newValueRaw);
                if (isNaN(newValue) || newValue < 0) {
                    alert("Invalid amount. Please enter a non-negative number."); isValid = false;
                }
            } else if (field === 'date') {
                 // Basic check: Ensure it's not empty and looks like a date the input would provide
                if (!newValueRaw) {
                    alert("Date cannot be empty."); isValid = false;
                } else if (!/^\d{4}-\d{2}-\d{2}$/.test(newValueRaw)) {
                     console.warn("Potentially invalid date format entered:", newValueRaw);
                     // Allow saving, browser might handle it if input type=date was used
                }
                 newValue = newValueRaw; // Store as YYYY-MM-DD string
            } else { // Description, Category
                newValue = newValueRaw.trim();
                 if (field === 'description' && !newValue) {
                     alert("Description cannot be empty."); isValid = false;
                 }
            }

            cell.classList.remove('editing');

            if (saveChange && isValid && newValue !== originalValue) {
                 // ** Correct Sequence **
                 pushUndoAction({ type: 'edit', rowId: rowId, field: field, oldValue: originalValue, newValue: newValue }); //
                 currentScanData[dataIndex][field] = newValue; //
                 autoSaveChanges(); // [cite: 99]
                 cell.innerHTML = formatCellContent(field, newValue); //
            } else {
                 cell.innerHTML = cell.dataset.originalContent; //
            }
            delete cell.dataset.originalContent; // [cite: 102]
        };

        const handleBlur = () => {
             setTimeout(() => handleEditEnd(true), 0);
        }; // [cite: 103]
        const handleKeyDown = (e) => {
            if (e.key === 'Enter') { e.preventDefault(); handleEditEnd(true); } // [cite: 104]
            else if (e.key === 'Escape') { e.preventDefault(); handleEditEnd(false); } // [cite: 105]
        };

        input.addEventListener('blur', handleBlur); // [cite: 106]
        input.addEventListener('keydown', handleKeyDown); // [cite: 106]
    }


    function selectTableRow(rowElement) { /* Based on*/
         if (selectedRowElement) {
            selectedRowElement.classList.remove('selected');
        }
        rowElement.classList.add('selected');
        selectedRowElement = rowElement;
        const emailKey = rowElement.dataset.emailKey;
        const rowId = rowElement.dataset.rowId;
        const deductionData = currentScanData.find(d => d.rowId == rowId);
        const emailData = pseudoEmails[emailKey];
        selectedEmailKeySpan.textContent = emailKey || 'None';
        if (emailData) {
            emailContent.innerHTML = `<strong>Subject:</strong> ${emailData.subject || '(No Subject)'}<br>--------------------<br>${emailData.body || '(No Body)'}`;
        } else {
             emailContent.innerHTML = `<p>No corresponding email found for key: ${emailKey}</p>`;
        }
        attachmentsList.innerHTML = '';
        let attachmentsToShow = [];
        if (emailData?.attachments?.length > 0) {
             attachmentsToShow = emailData.attachments;
        } else if (deductionData?.attachment) {
             attachmentsToShow = [deductionData.attachment];
        }
        if (attachmentsToShow.length > 0) {
            attachmentsToShow.forEach(att => {
                if (!att) return;
                const li = document.createElement('li');
                li.innerHTML = `<a href="#" class="attachment-link" data-attachment="${att}"><i class="fas fa-paperclip"></i> ${att}</a>`;
                attachmentsList.appendChild(li);
            });
        } else {
            attachmentsList.innerHTML = '<li>No attachments found</li>';
        }
    }

     function deleteTableRow(rowId) { /* Based on*/
         const rowIndex = currentScanData.findIndex(item => item.rowId == rowId);
         if (rowIndex === -1) { console.warn("Delete failed: Row not found in current data", rowId); return; }
         if (confirm("Are you sure you want to delete this deduction row?")) {
             const deletedData = { ...currentScanData[rowIndex] };
             pushUndoAction({ type: 'delete', index: rowIndex, data: deletedData });
             currentScanData.splice(rowIndex, 1);
             autoSaveChanges();
             if (selectedRowElement && selectedRowElement.dataset.rowId == rowId) {
                 resetDetailsPanels();
                 selectedRowElement = null;
             }
             renderDeductionsTable(currentScanData);
             console.log("Deleted row:", deletedData);
         }
     }

     // addTableRow function REMOVED

    function resetDetailsPanels() { /* Based on*/
        selectedEmailKeySpan.textContent = 'None';
        emailContent.innerHTML = '<p>Select a deductible item from the table.</p>';
        attachmentsList.innerHTML = '<li>No item selected</li>';
    }


    // --- Past Scans Functionality ---
    function renderPastScans() { /* Based on*/
        pastScansList.innerHTML = '';
        pseudoPastScans.forEach(scan => {
            const li = document.createElement('li');
            li.dataset.scanId = scan.id;
            if (scan.id === activeScanId) {
                li.classList.add('active-scan');
            }
            li.innerHTML = `
                <span class="scan-name" title="Load Scan: ${scan.name}">${scan.name}</span>
                <button class="icon-button rename-scan-btn" title="Rename Scan"><i class="fas fa-pencil-alt"></i></button>
                <button class="icon-button delete-scan-btn" title="Delete Scan"><i class="fas fa-trash-alt"></i></button>
            `;
           pastScansList.appendChild(li);
        });
    }

    function handlePastScanClick(event) { /* Based on*/
        const target = event.target;
        const listItem = target.closest('li');
        if (!listItem) return;
        const scanId = listItem.dataset.scanId;
        if (target.classList.contains('scan-name')) {
            if (scanId !== activeScanId) { loadPastScan(scanId); }
        } else if (target.closest('.rename-scan-btn')) {
            renamePastScan(listItem);
        } else if (target.closest('.delete-scan-btn')) {
            deletePastScan(scanId, listItem);
        }
    }

    function loadPastScan(scanId) { /* Based on*/
        console.log(`Loading past scan: ${scanId}`);
        const scanInfo = pseudoPastScans.find(s => s.id === scanId);
        if (!scanInfo || !pseudoPastScansDataStore[scanId]) {
             console.error(`Scan data or info not found for ID: ${scanId}`);
             alert(`Error: Could not load scan ${scanId}.`);
             showView('home'); return;
        }
        activeScanId = scanId;
        scanTitle.textContent = `Scan: ${scanInfo.name}`;
        showView('results'); // This loads data and renders
        renderPastScans(); // Highlight active
    }

    function renamePastScan(listItem) { /* Based on*/
        const scanId = listItem.dataset.scanId;
        const nameSpan = listItem.querySelector('.scan-name');
        const currentName = nameSpan.textContent;
        const input = document.createElement('input');
        input.type = 'text'; input.value = currentName; input.className = 'rename-input';
        nameSpan.style.display = 'none';
        listItem.querySelectorAll('.icon-button').forEach(btn => btn.style.display = 'none');
        listItem.insertBefore(input, listItem.firstChild);
        input.focus(); input.select();
        const saveRename = () => {
             const newName = input.value.trim();
             input.remove();
             nameSpan.style.display = ''; listItem.querySelectorAll('.icon-button').forEach(btn => btn.style.display = '');
             if (newName && newName !== currentName) {
                 nameSpan.textContent = newName; nameSpan.title = `Load Scan: ${newName}`;
                 const scanIndex = pseudoPastScans.findIndex(s => s.id === scanId);
                 if (scanIndex > -1) { pseudoPastScans[scanIndex].name = newName; }
                 if(scanId === activeScanId) { scanTitle.textContent = `Scan: ${newName}`; }
                 console.log(`Renamed scan ${scanId} to ${newName}`);
             } else { nameSpan.textContent = currentName; }
        };
        input.addEventListener('blur', saveRename);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); saveRename(); }
            else if (e.key === 'Escape') { e.preventDefault(); input.remove(); nameSpan.textContent = currentName; nameSpan.style.display = ''; listItem.querySelectorAll('.icon-button').forEach(btn => btn.style.display = ''); }
        });
    }

    function deletePastScan(scanId, listItem) { /* Based on*/
        if (confirm(`Are you sure you want to permanently delete the scan "${listItem.querySelector('.scan-name').textContent}"? This cannot be undone.`)) {
             pseudoPastScans = pseudoPastScans.filter(s => s.id !== scanId);
             delete pseudoPastScansDataStore[scanId];
             listItem.remove();
             console.log(`Deleted past scan: ${scanId}`);
             if (scanId === activeScanId) { alert("The currently active scan has been deleted."); showView('home'); }
        }
    }

    // --- Sidebar Toggle ---
    function toggleSidebar() { /* Based on*/
        mainLayout.classList.toggle('sidebar-collapsed');
    }

    // --- Export & Download ---
     function exportToExcel() { /* Based on*/
         if (!currentScanData || currentScanData.length === 0) { alert("No data in the current view to export."); return; }
         console.log("Preparing data for Excel export...");
         const exportData = currentScanData.map(({ rowId, ...rest }) => ({ Description: rest.description, Amount: rest.amount, Date: rest.date, Category: rest.category, 'Email Key': rest.emailKey, Attachment: rest.attachment }));
         try {
             const ws = XLSX.utils.json_to_sheet(exportData);
             const wb = XLSX.utils.book_new();
             XLSX.utils.book_append_sheet(wb, ws, "Deductions");
             const filename = `InboxDeduct_Export_${activeScanId || 'current'}_${new Date().toISOString().split('T')[0]}.xlsx`;
             XLSX.writeFile(wb, filename);
             console.log("Excel export triggered.");
         } catch (error) { console.error("Error exporting to Excel:", error); alert("An error occurred while exporting to Excel. See console for details."); }
     }
     function downloadEmailsAndAttachments() { /* Based on*/
         if (!currentScanData || currentScanData.length === 0) { alert("No deductions loaded to fetch emails/attachments for."); return; }
         console.log("Simulating download of emails and attachments...");
         const emailKeys = new Set();
         currentScanData.forEach(item => { if (item.emailKey && item.emailKey !== 'manual_entry' && item.emailKey !== 'email_missing_ref') { emailKeys.add(item.emailKey); } });
         if (emailKeys.size === 0) { alert("No valid email references found in the current deductions list."); return; }
         let summary = "--- Simulation: Download Emails & Attachments ---\n\n";
         summary += `Would attempt to download ${emailKeys.size} unique emails:\n`;
         emailKeys.forEach(key => {
             const emailData = pseudoEmails[key];
             summary += `\nEmail Key: ${key}\n`;
             if (emailData) { summary += `  Subject: ${emailData.subject || '(No Subject)'}\n`; summary += `  Attachments: ${emailData.attachments?.join(', ') || '(None)'}\n`; }
             else { summary += `  (Email data not found for this key)\n`; }
         });
         summary += "\n--- End Simulation ---";
         console.log(summary);
         alert("Simulation complete. Check the browser console (F12) for details.\n(Actual download requires server-side processing or complex browser APIs.)");
     }


    // --- Event Listeners ---
    verifyEmailBtn.addEventListener('click', () => { /* Based on [cite: 186] */
        if (isEmailVerified) return;
        verifyEmailBtn.textContent = "Verifying..."; verifyEmailBtn.disabled = true;
        setTimeout(() => { isEmailVerified = true; updateEmailStatusUI(); }, 1500);
    });
    scanButton.addEventListener('click', () => { /* Based on*/
        const start = startDateInput.value;
        const end = endDateInput.value;
        if (!isEmailVerified) { alert("Please verify your email address first."); return; }
        if (!start || !end) { alert("Please select both a start and end date."); return; }
        if (new Date(start) > new Date(end)) { alert("Start date cannot be after end date."); return; }
        console.log(`Simulating new scan from ${start} to ${end}`);
        const newScanId = `scan_${Date.now()}`;
        const newScanName = `Scan ${start} to ${end}`;
        const newScanData = []; // New scans start empty
        pseudoPastScans.unshift({ id: newScanId, name: newScanName });
        pseudoPastScansDataStore[newScanId] = newScanData.map(d => ({...d}));
        activeScanId = newScanId;
        scanTitle.textContent = `Scan: ${newScanName}`;
        renderPastScans();
        showView('results');
        alert("New scan created. Edit deductions as needed. Changes are saved automatically.");
    });
    homeButton.addEventListener('click', (e) => { e.preventDefault(); showView('home'); }); // [cite: 195]
    sidebarToggleButton.addEventListener('click', toggleSidebar); // [cite: 196]
    pastScansList.addEventListener('click', handlePastScanClick); // [cite: 196]
    deductiblesTableBody.addEventListener('click', handleTableCellClick); // [cite: 197]
    deductiblesTableBody.addEventListener('dblclick', handleTableCellDoubleClick); // [cite: 197]
    // Add Row listener REMOVED [cite: 198]
    undoButton.addEventListener('click', performUndo); // [cite: 198]
    exportExcelBtn.addEventListener('click', exportToExcel); // [cite: 198]
    downloadEmailsBtn.addEventListener('click', downloadEmailsAndAttachments); // [cite: 198]


    // --- Initial Setup ---
    initializePseudoData(); // [cite: 199]
    updateEmailStatusUI(); // [cite: 200]
    showView('home'); // [cite: 200]
    // Set default dates to current year [cite: 200]
    const today = new Date().toISOString().split('T')[0];
    const currentYear = new Date().getFullYear();
    const startOfYear = `${currentYear}-01-01`;
    startDateInput.value = startOfYear;
    endDateInput.value = today;
    updateUndoButton(); // [cite: 201]

}); // [cite: 202]