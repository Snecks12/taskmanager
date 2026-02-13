function openGroupMembersPopup(group) {
    // remove existing popup if any
    const existing = document.querySelector('.group-members-popup');
    if (existing) existing.remove();

    const popup = document.createElement('div');
    popup.className = 'group-members-popup';

    popup.innerHTML = `
        <div class="group-popup-card">
            <h3>Group Members</h3>

            <ul class="group-member-list">
                ${group.members.map(memberId => {
                    const emp = theEmployee.find(e => e.id === memberId);
                    const name = emp ? emp.name : memberId;

                    return `
                        <li class="group-member-item">
                            <span class="member-name">${name}</span>
                            <button
                                class="kick-btn"
                                data-group="${group.id}"
                                data-member="${memberId}"
                            >
                                Kick
                            </button>
                        </li>
                    `;
                }).join('')}
            </ul>

            <div class="popup-actions">
                <button id="closeGroupPopup">Close</button>
            </div>
        </div>
    `;

    popup.addEventListener('click', e => e.stopPropagation());
    document.body.appendChild(popup);

    // ✅ Close button
    popup.querySelector('#closeGroupPopup').onclick = () => {
        popup.remove();
    };

    // ✅ Kick buttons
    popup.querySelectorAll('.kick-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();

            const groupId = btn.dataset.group;
            const memberId = btn.dataset.member;

            if (!confirm('Remove this member from the group?')) return;

            kickMemberFromGroup(groupId, memberId);

            // 🔄 Refresh popup UI
            const updatedGroup = getMailContacts().find(c => c.id === groupId);
            popup.remove();

            if (updatedGroup) {
                openGroupMembersPopup(updatedGroup);
            }
        });
    });
}



function kickMemberFromGroup(groupId, employeeId) {
    const contacts = getMailContacts();
    const conversations = getMailConversations();

    const group = contacts.find(c => c.id === groupId);
    if (!group) return;

    group.members = group.members.filter(id => id !== employeeId);

    // If group becomes empty → delete it
    if (group.members.length === 0) {
        const index = contacts.findIndex(c => c.id === groupId);
        if (index !== -1) contacts.splice(index, 1);
        delete conversations[groupId];
        showToast('Group deleted (no members left)', 'success');
    } else {
        showToast('Member removed', 'success');
    }

    setMailContacts(contacts);
    setMailConversations(conversations);

    // refresh mail if open
    if (typeof window.refreshMailContacts === 'function') {
        window.refreshMailContacts();
    }
}

// ================= MAIL STORAGE HELPERS =================
function getMailContacts() {
    return JSON.parse(localStorage.getItem('mailContacts')) || [];
}

function setMailContacts(data) {
    localStorage.setItem('mailContacts', JSON.stringify(data));
}

function getMailConversations() {
    return JSON.parse(localStorage.getItem('mailConversations')) || {};
}

function setMailConversations(data) {
    localStorage.setItem('mailConversations', JSON.stringify(data));
}
function createGroupChat(groupName, members) {
    const contacts = getMailContacts();
    const conversations = getMailConversations();

    const groupId = "group_" + Date.now();

    contacts.push({
        id: groupId,
        name: groupName,
        type: "group",
        members: members.map(m => m.id),
        images: ["assets/group-icons.jpg"]
    });

    conversations[groupId] = [];

    setMailContacts(contacts);
    setMailConversations(conversations);
}
//FOR OVERLAY POPUP//
function createOverlay({ zIndex = 9999, onClose } = {}) {
    // Remove existing overlay if any
    const existing = document.querySelector('.app-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.classList.add('app-overlay');
    overlay.style.zIndex = zIndex;

   
    overlay.addEventListener('click', (e) => {
        if (e.target.closest(
        '.group-members-popup, .delete-modal, .new-mail-window, .wrap'
    )) {
        return;
    }

    overlay.remove();

        // ✅ Close ALL known popups/modals
        document.querySelectorAll(
            `
            .add-task-form,
            .add-my-task-div,
            .comment-popup,
            .comment-detail-popup,
            .popDiv,
            .open-div,
            .notification-container,
            .comment-popup
            `
        ).forEach(popup => popup.remove());

        if (typeof onClose === 'function') {
            onClose();
        }
    });

    document.body.appendChild(overlay);

    return overlay;
}

// TOAST GLOBAL//
function showToast(message, type = "success", duration = 3000) {
    const container = document.getElementById("toastStatus");

    const toast = document.createElement('div');
    toast.className = `toast-msg ${type}`;
    toast.innerHTML = `
        <span>${type === 'success' ? '✅' : '⚠'}</span>
        <div>${message}</div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px) scale(0.9)';
        setTimeout(() => { toast.remove(), 3000 });
    }, duration);
}
//FOR THE REPLY NOTIFICATION//
function saveNotificationReply(task, replyText) {
    const notifications = JSON.parse(localStorage.getItem('notifications')) || [];

    notifications.unshift({
        id: Date.now(),
        from: 'current User',
        taskId: task.id,
        title: task.text,
        message: replyText,
        createdAt: new Date().toLocaleString(),
        read: false
    });

    localStorage.setItem('notifications', JSON.stringify(notifications));
}

//FOR POPUP COMMENT DETAIL//
function openCommentDetailPopup(comment) {
    if (document.querySelector('.comment-detail-popup')) return;

    const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    const task = tasks.find(t => String(t.id) === String(comment.taskId));
    if (!task) return;

    const popup = document.createElement('div');
    popup.className = 'comment-detail-popup';
    popup.innerHTML = `
        <div class="comment-detail-content">
                    <div class= "comment-header-detail">
                    <button id = "delete-comment"><span class="material-symbols-outlined">delete</span></button>
                        <div class = "comment-from"><strong>From: </strong>${comment.from || 'Unknown'}</div>
                        <div class = "comment-task-notif"><strong>Task name: </strong>${task.text}</div>
                    </div>
            <div class="task-meta">
                <p><strong>Due:</strong> ${task.dueDate || '-'}</p>
                <p><strong>Stage:</strong> ${task.stage || '-'}</p>
                <p><strong>Priority:</strong> ${task.priority || '-'}</p>
                <p><strong>Team:</strong> ${task.team || '-'}</p>
                <p><strong>Assignee:</strong> ${task.assignee || '-'}</p>
            </div>

            <label>Reply</label>
            <input type="text" id="replyInput" placeholder="Write a reply..." />

            <div class="popup-actions">
                <button id="sendReply">Reply</button>
                <button id="closePopup">Close</button>
            </div>
        </div>
    `;

    document.body.appendChild(popup);

    popup.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    popup.querySelector('#closePopup').onclick = () => popup.remove();

    popup.querySelector('#sendReply').onclick = () => {
        const reply = popup.querySelector('#replyInput').value.trim();
        if (!reply) return;

        saveNotificationReply(task, reply);
        popup.remove();
    };
    popup.querySelector('#delete-comment').onclick = () => {
        const comments = JSON.parse(localStorage.getItem('dashboardComments')) || [];
        commentIndex = comments.findIndex(c => c.id === comment.id);
        if (commentIndex !== -1) {
            comments.splice(commentIndex, 1);
            localStorage.setItem('dashboardComments', JSON.stringify(comments));
            renderDashboardComments();
        }

        popup.remove();
    }
}

// FOR TABLE EVENT//
function openCommentPopup(taskId, taskName) {
    if (document.querySelector('.comment-popup')) return;

    const popup = document.createElement('div');
    popup.classList.add = 'comment-popup';
    const overlay = createOverlay();
    popup.innerHTML = `
        <div class="comment-popup-content">
            <h3>Add Comment</h3>
            <label>From</label>
            <input type="text" id = "from"value="Current User" placeholder = "Write your name" />
            <label>Task</label>
            <input type="text" id="taskName" value="${taskName}" disabled />

            <label>Comment</label>
            <input type="text" id="commentInput" placeholder="Write comment..." />

            <div class="popup-actions">
                <button id="saveComment">Save</button>
                <button id="closeComment">Close</button>
            </div>
        </div>
    `;

    document.body.appendChild(popup);

    popup.querySelector('#closeComment').onclick = () => { popup.remove(), overlay.remove() };

    popup.querySelector('#saveComment').onclick = () => {
        const from = popup.querySelector('#from').value.trim();
        if (!from) return;

        const comment = popup.querySelector('#commentInput').value.trim();
        if (!comment) return;

        saveDashboardComment(taskId, from, taskName, comment);
        popup.remove();
        overlay.remove();
    };
    popup.addEventListener('click', (e) => { e.stopPropagation() });
    overlay.appendChild(popup);
 
}
function saveDashboardComment(taskId, from, taskName, comment) {
    const comments = JSON.parse(localStorage.getItem('dashboardComments')) || [];

    comments.push({
        id: Date.now(),
        taskId,
        from,
        taskName,
        comment, // ✅ THIS IS THE FIX
        createdAt: new Date().toLocaleString()
    });

    localStorage.setItem('dashboardComments', JSON.stringify(comments));
    renderDashboardComments();
}

function renderDashboardComments() {
    const container = document.querySelector('.comments');
    if (!container) return;

    const comments = JSON.parse(localStorage.getItem('dashboardComments')) || [];
    container.innerHTML = '';

    if (comments.length === 0) {
        container.innerHTML = `
            <p style="text-align:center; padding:20px; color:#444;">
                No comments yet.
            </p>
        `;
        return;
    }

    comments.forEach(c => {
        const div = document.createElement('div');
        div.className = 'comment-content';
        div.innerHTML = `
            <div class="comment-content">
            <p class="comment-from"><strong>From: </strong>${c.from || 'Unknown'}</p>
            <p class="comment-task"><strong>Task: </strong>${c.taskName || 'Unknown task'}</p>
            <p class="comment-message"><strong>Comment: </strong>${c.comment || '(No comment text)'}</p>
            <small class="comment-date">${c.createdAt || ''}</small>
            </div>
        `;
        div.addEventListener('click', (e) => {
            console.log('clicked!', c);
            e.stopPropagation();
            e.preventDefault();
            openCommentDetailPopup(c);
        });
        container.appendChild(div);
    });
    console.log('COMMENTS:', JSON.parse(localStorage.getItem('dashboardComments')));

}


function handleSidebarClick(event, page) {
    event.preventDefault();
    closeSidebar();
    loadContent(page);
}
// FOR TABLE TO CARD MOBILE VIEW//
function buildMyTasksMobile() {
    const table = document.querySelector(".my-tasks-table");
    const mobile = document.getElementById("myTasksMobile");

    if (!table || !mobile) return;

    mobile.innerHTML = "";

    table.querySelectorAll("tbody tr").forEach(row => {
        const cells = row.querySelectorAll("td");

        const card = document.createElement("div");
        card.className = "task-card";

        card.innerHTML = `
      <div class="title">${cells[1]?.innerText || ""}</div>
      <div class="meta">Due: ${cells[2]?.innerText || "-"}</div>
      <div class="meta">Priority: ${cells[4]?.innerText || "-"}</div>
      <span class="status">${cells[3]?.innerText || ""}</span>
    `;

        mobile.appendChild(card);
    });
}


document.addEventListener("click", function (e) {

    /* ================= ADD TASK ================= */
    if (e.target.closest('#taskListButton')) {
        e.preventDefault();
        return;
    }

    /* ================= CATEGORIES ================= */
    if (e.target.closest('#addBtn')) {
        e.preventDefault();
        openCategoryModal();
        return;
    }

    /* ================= TRACKING ================= */
    if (e.target.closest('#addTrack')) {
        e.preventDefault();
        openTrackingModal();
        return;
    }

    /* ================= COMMENTS ================= */
    if (e.target.closest('.add-comment')) {
        e.preventDefault();
        return;
    }

});
function ensureIdsAndMetadata(key) {
    const arr = JSON.parse(localStorage.getItem(key)) || [];
    let changed = false;
    const now = new Date().toLocaleString();

    for (let i = 0; i < arr.length; i++) {
        if (!arr[i].id) {
            arr[i].id = Date.now() + i;
            changed = true;
        }
        if (!arr[i].createdAt) {
            arr[i].createdAt = now;
            changed = true;
        }
    }
    if (changed) localStorage.setItem(key, JSON.stringify(arr));
}

ensureIdsAndMetadata('tasks');
ensureIdsAndMetadata('taskList');

// 2. Merge legacy `taskList` into `tasks`
(function mergeLegacyTaskList() {
    try {
        const legacy = JSON.parse(localStorage.getItem('taskList')) || [];
        if (!Array.isArray(legacy) || legacy.length === 0) return;
        const tasksArr = JSON.parse(localStorage.getItem('tasks')) || [];
        const ids = new Set(tasksArr.map(t => String(t.id)));
        let added = 0;
        legacy.forEach(item => {
            if (!ids.has(String(item.id))) {
                tasksArr.push(item);
                added++;
            }
        });
        if (added > 0) {
            localStorage.setItem('tasks', JSON.stringify(tasksArr));
            console.log('Merged', added, 'items from taskList into tasks');
        }
        localStorage.removeItem('taskList');
    } catch (e) {
        console.warn('Failed to merge legacy taskList:', e);
    }
})();

const myToast = document.getElementById("toast");
const mailBtn = document.getElementById("mailBtn");
const profile_button = document.querySelector(".profile-button");
const theEmployee = [
    { id: "emp_1", name: "Alice", department: "HR", position: "Manager", email: "alice@example.com" },
    { id: "emp_2", name: "Bob", department: "IT", position: "Developer", email: "bob@example.com" },
    { id: "emp_3", name: "Charlie", department: "Finance", position: "Analyst", email: "charlie@example.com" }
];
const allGroups = [];

// ========== SCHEDULE CALENDAR EVENTS ========== //
function highlightEventDates() {
    const schedules = JSON.parse(localStorage.getItem('schedules')) || [];
    const datesWithEvents = new Set(schedules.map(s => s.date));

    document.querySelectorAll('.calendar-date').forEach(dateEl => {
        dateEl.classList.remove('has-event');

        if (datesWithEvents.has(dateEl.dataset.date)) {
            dateEl.classList.add('has-event');
        }
    });
}

function renderSchedulePage() {
    const schedules = JSON.parse(localStorage.getItem('schedules')) || [];

    if (schedules.length === 0) {
        return `
            <div class="schedule-page">
                <div class="no-schedules" style="text-align:center; padding:40px;">
                    <h2>No schedules yet</h2>
                    <p>Click on a calendar date to create a schedule!</p>
                </div>
            </div>
        `;
    }

    schedules.sort((a, b) => {
        const dateA = new Date(a.date + ' ' + a.time);
        const dateB = new Date(b.date + ' ' + b.time);
        return dateA - dateB;
    });

    let cards = '';
    schedules.forEach(schedule => {
        const dateObj = new Date(schedule.date);
        const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN",
            "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
        const month = monthNames[dateObj.getMonth()];
        const day = dateObj.getDate();
        const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });

        const timeParts = schedule.time.split(':');
        let hours = parseInt(timeParts[0]);
        const minutes = timeParts[1];
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        const formattedTime = `${hours}:${minutes} ${ampm}`;

        cards += `
            <div class="card" data-schedule-id="${schedule.id}">
                <button class="schedule-menu" onclick="deleteSchedule(${schedule.id})">
                    <span class="material-symbols-outlined">delete</span>
                </button>
                <h1 class="date">${month} ${day}</h1>
                <p class="time">${dayName}&nbsp;&nbsp;${formattedTime}</p>
                <hr>
                <div class="details">
                    <p class="label">Details:</p>
                    <p class="desc">${schedule.description}</p>
                </div>
            </div>
        `;
    });

    return `<div class="schedule-page">${cards}</div>`;
}

function deleteSchedule(id) {
    if (!confirm('Are you sure you want to delete this schedule?')) {
        return;
    }

    const schedules = JSON.parse(localStorage.getItem('schedules')) || [];
    const filteredSchedules = schedules.filter(s => s.id !== id);

    localStorage.setItem('schedules', JSON.stringify(filteredSchedules));

    loadContent('schedule');

    const toast = document.getElementById('toast');
    if (toast) {
        toast.textContent = '🗑️ Schedule deleted!';
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }
}

function selectedDateContainer(pickDates) {
    console.log('selectedDateContainer called with date:', pickDates);
    const existingDiv = document.querySelector('.open-div');
    if (existingDiv) {
        existingDiv.remove();
    }

    const OpenCalendarDiv = document.createElement('div');
    const overlay = createOverlay();
    OpenCalendarDiv.classList.add('open-div');
    OpenCalendarDiv.innerHTML = `
        <div class="open-div-container">
            <h3>Select date to schedule</h3>

            <label for = "Date">Date</label>
            <input type="text" id="scheduleDate" value="${pickDates}" readonly />

            <label for = "time">Time</label>
            <input type="time" id="scheduleTime" required />

            <label for="description">Write the details:</label>
            <textarea id="scheduleDescription" class = "schedule-desc" placeholder="Write the description" required></textarea>
            
            <div style="display: flex; gap: 10px; margin-top: 10px;">
                <button type="button" id="saveSchedule" class = "save-schedule">Save</button>
                <button type="button" id="cancelSchedule" class = "delete-schedule">Cancel</button>
            </div>
        </div>
    `;
      OpenCalendarDiv.addEventListener('click', (e) => e.stopPropagation());
    document.body.appendChild(OpenCalendarDiv);
    overlay.appendChild(OpenCalendarDiv);
    setTimeout(() => {
        const saveBtn = document.getElementById('saveSchedule');
        const cancelBtn = document.getElementById('cancelSchedule');
        const dateInput = document.getElementById('scheduleDate');
        const timeInput = document.getElementById('scheduleTime');
        const descInput = document.getElementById('scheduleDescription');

        console.log('Elements found:', {
            saveBtn: !!saveBtn,
            cancelBtn: !!cancelBtn,
            dateInput: !!dateInput,
            timeInput: !!timeInput,
            descInput: !!descInput
        });

        if (saveBtn) {
            saveBtn.onclick = function (e) {
                e.stopPropagation();
                e.preventDefault();

                console.log('💾 Save button clicked!');

                const date = dateInput.value;
                const time = timeInput.value;
                const description = descInput.value.trim();

                console.log('Form values:', { date, time, description });

                if (!time || !description) {
                    alert('Please fill in both time and description!');
                    return;
                }

                const schedules = JSON.parse(localStorage.getItem('schedules')) || [];

                const newSchedule = {
                    id: Date.now(),
                    date: date,
                    time: time,
                    description: description,
                    createdAt: new Date().toLocaleString()
                };

                schedules.push(newSchedule);
                localStorage.setItem('schedules', JSON.stringify(schedules));


                console.log('✅ Schedule saved:', newSchedule);
                console.log('Total schedules in storage:', schedules.length);

                const toast = document.getElementById('toast');
                if (toast) {
                    toast.textContent = '✅ Schedule saved!';
                    toast.classList.add('show');
                    setTimeout(() => toast.classList.remove('show'), 3000);
                } else {
                    alert('Schedule saved successfully!');
                }
                overlay.remove(); 
                OpenCalendarDiv.remove();
            };
        } else {
            console.error('❌ Save button not found!');
        }

        if (cancelBtn) {
            cancelBtn.onclick = function (e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('❌ Cancel button clicked!');
                OpenCalendarDiv.remove();
                overlay.remove();
            };
        } else {
            console.error('❌ Cancel button not found!');
        }
    }, 100);
    console.log('Popup appended to body');
}
document.addEventListener('click', (e) => {
    const dateEl = e.target.closest('.calendar-date');
    if (!dateEl) return;

    if (!dateEl.classList.contains('selected-date')) {
        dateEl.classList.add('selected-date');
        selectedDateContainer(dateEl.dataset.date);
    }
});


document.addEventListener('click', function (e) {
    const delBtn = e.target.closest('.delete-task-btn');
    if (delBtn) {
        const id = delBtn.dataset.id;
        deleteDashboardTask(id);
        showToast('Task Done!', 'success');
        return;
    }
});

function saveDashboardOrder() {
    const container = document.querySelector(".task-list");
    if (!container) return;

    const orderedIds = [...container.querySelectorAll(".task-item")]
        .map(item => item.dataset.id);

    const tasks = JSON.parse(localStorage.getItem("dashboardTasks")) || [];

    const orderedTasks = orderedIds
        .map(id => tasks.find(t => String(t.id) === String(id)))
        .filter(Boolean);

    localStorage.setItem("dashboardTasks", JSON.stringify(orderedTasks));
}

function loadContent(section) {
    const contentDiv = document.getElementById("mainContent");
    if (!contentDiv) return;

    // Clear any error states
    console.clear();
    console.log('🔄 Loading section:', section);

    // Remove leftover modals
    document.querySelectorAll('.add-my-task-div').forEach(modal => modal.remove());
    document.querySelectorAll('.open-div').forEach(modal => modal.remove());


    function safeRenderTasks() {
        const taskListDom = document.querySelector('.task-list');
        if (typeof window.renderTasks === 'function' && taskListDom) {
            window.renderTasks();
        }
    }

    function getDragAfterElement(container, y) {
        const draggableElements = [
            ...container.querySelectorAll(".task-item:not(.dragging)")
        ];

        return draggableElements.reduce(
            (closest, child) => {
                const box = child.getBoundingClientRect();
                const offset = y - box.top - box.height / 2;

                if (offset < 0 && offset > closest.offset) {
                    return { offset, element: child };
                }
                return closest;
            },
            { offset: Number.NEGATIVE_INFINITY }
        ).element;
    }

    if (section === 'dashboard') {
        contentDiv.innerHTML = `
            <!----CALENDAR---->
            <div class="calendar">
                <div class="calendar-header">
                    <button id="prevMonth" class="prev-month"><span class="material-symbols-outlined">line_start_arrow</span></button>
                    <h2 id="monthYear"></h2>
                    <button id="nextMonth" class="nxt-month"><span class="material-symbols-outlined">line_end_arrow</span></button>
                </div>
                <div class="calendar-days">
                    <div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div><div>Su</div>
                </div>
                <div class="calendar-dates" id="calendarDates"></div>
            </div>

            <!-- My Tasks (dashboard) -->
                <div class="mytasks">
                <div class="task-header">
                    <h3>My Tasks</h3>
                    <button
                    id="taskListButton"
                    style="
                        background: #007bff;
                        color: white;
                        border: none;
                        padding: 8px 15px;
                        border-radius: 5px;
                        cursor: pointer;
                    "
                    >
                    + Add Task
                    </button>
                </div>
                <div class="task-list"></div>
                </div>

            <!-- Categories -->
            <div class="categories-container">
                <div class="header">
                    <h2>Categories</h2>
                    <button id="addBtn" class="add">➕</button>
                </div>
                <div class="categories-content">
                    <div class="categories">
                        <div class="categories-inside">
                            <span class="material-symbols-outlined">diversity_3</span>
                            <span class="spanName">Team</span>
                        </div>
                        <button class="button-profile" style="border:none; background:none; color:black;"><span class="material-symbols-outlined">more_vert</span></button>
                    </div>
                    <div class="categories">
                        <div class="categories-inside">
                            <span class="material-symbols-outlined">work</span>
                            <span class="spanName">Work</span>
                        </div>
                        <button class="button-profile" style="border:none; background:none; color:black;"><span class="material-symbols-outlined">more_vert</span></button>
                    </div>
                    <div class="categories">
                        <div class="categories-inside">
                            <span class="material-symbols-outlined">supervisor_account</span>
                            <span class="spanName">Supervisor's</span>
                        </div>
                        <button class="button-profile" style="border:none; background:none; color:black;"><span class="material-symbols-outlined">more_vert</span></button>
                    </div>
                </div>
            </div>

            <!-- Tracking -->
            <div class="myTracking">
                <div class="category-header">
                    <h2>Track a task</h2>
                    <button id="addTrack" class="add-track" style="cursor:pointer; background:none; border:none; outline:none;">
                        <span class="tracking-add-button">➕</span>
                    </button>
                </div>
                <div class="track-categories">
                    <div class="track-sample">
                        <div class="track-samp-ins">
                            <div class="center-span">
                                <span class="material-symbols-outlined">timer</span>
                                <span>Create Invoice 10m 5s</span>
                            </div>
                            <div class="x-progress"><span class="progress-span"></span></div>
                             <div class="track-controls-div">
                            <button class="control-btn-test"><span class="material-symbols-outlined">play_arrow</span></button>
                            <button class="control-del-test"><span class="material-symbols-outlined">delete</span></button>
                            </div>
                        </div>
                    </div>
                    <div class="track-sample">
                        <div class="track-samp-ins">
                            <div class="center-span">
                                <span class="material-symbols-outlined">timer</span>
                                <span>Slack logo design 30m 18s</span>
                            </div>
                            <div class="x-progress"><span class="progress-span"></span></div>
                            <div class="track-controls-div">
                            <button class="control-btn-test"><span class="material-symbols-outlined">play_arrow</span></button>
                            <button class="control-del-test"><span class="material-symbols-outlined">delete</span></button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Comments -->
            <div class="comments-section">
                <div class="comment-title"><h2>Comments</h2></div>
                <div class="comments"></div>
            </div>
            
            <!---CHART⚽--->
                <div class="chart-wrapper">
                <h3>Live Analytics</h3>
                <canvas id="deletedChart"></canvas>
                </div>`;



        console.log(
            'loadContent: dashboard view opened. tasks=',
            JSON.parse(localStorage.getItem('tasks') || '[]').length,
            'taskList=',
            JSON.parse(localStorage.getItem('taskList') || '[]').length
        );

        // calendar elements (safe to query after inject)
        const calendarDates = document.getElementById("calendarDates");//DATES
        const monthYear = document.getElementById("monthYear");//MONTH
        const prevMonth = document.getElementById("prevMonth");
        const nextMonth = document.getElementById("nextMonth");

        if (!window.calendarCurrentDate) {
            window.calendarCurrentDate = new Date();
        }
        // const currentDate = window.calendarCurrentDate;

        function renderCalendar(date) {
            if (!calendarDates || !monthYear) return;
            calendarDates.innerHTML = "";
            const year = date.getFullYear();
            const month = date.getMonth();

            monthYear.textContent = date.toLocaleString("default", {
                month: "long",
                year: "numeric"
            });

            const firstDay = new Date(year, month, 1).getDay();
            const offset = (firstDay + 6) % 7; // Adjust for Monday start
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const today = new Date();

            for (let i = 0; i < offset; i++) {
                calendarDates.innerHTML += `<div></div>`;
            }
            for (let day = 1; day <= daysInMonth; day++) {
                const dateDiv = document.createElement("div");
                dateDiv.classList.add('calendar-date'); // 👈 IMPORTANT
                dateDiv.textContent = day;

                const fullDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                dateDiv.dataset.date = fullDate; // 👈 IMPORTANT


                const isToday =
                    day === today.getDate() &&
                    month === today.getMonth() &&
                    year === today.getFullYear();

                if (isToday) dateDiv.classList.add("today");

                dateDiv.addEventListener("click", () => {
                    document.querySelectorAll(".calendar-dates div").forEach(d => d.classList.remove("selected"));
                    dateDiv.classList.add("selected");
                    const selectedDate = new Date(year, month, day);
                    selectedDateContainer(selectedDate.toLocaleDateString());
                });
                calendarDates.appendChild(dateDiv);
            }
        }


        // NEW CODE - removes old listeners first
        if (prevMonth) {
            const newPrev = prevMonth.cloneNode(true);
            prevMonth.parentNode.replaceChild(newPrev, prevMonth);
            newPrev.addEventListener("click", () => {
                window.calendarCurrentDate.setMonth(window.calendarCurrentDate.getMonth() - 1);
                renderCalendar(window.calendarCurrentDate);

            });
        }

        if (nextMonth) {
            const newNext = nextMonth.cloneNode(true);
            nextMonth.parentNode.replaceChild(newNext, nextMonth);
            newNext.addEventListener("click", () => {
                window.calendarCurrentDate.setMonth(window.calendarCurrentDate.getMonth() + 1);
                renderCalendar(window.calendarCurrentDate);
                highlightEventDates()
            });
        }
        renderCalendar(window.calendarCurrentDate);
        highlightEventDates();
        safeRenderTasks();
        // Fallback: sometimes renderTasks runs before DOM is fully painted — ensure tasks and chart render
        setTimeout(() => {
            if (typeof window.renderTasks === 'function') window.renderTasks();
            if (typeof updateDeletedChart === 'function') updateDeletedChart();
        }, 50);

        // Setup example listeners inside dashboard (these use querySelectorAll after injection)
        document.querySelectorAll('.control-btn-test').forEach(bts => {
            bts.addEventListener('click', () => alert("This is example only."));
        });
        document.querySelectorAll('.control-del-test').forEach(bts => {
            bts.addEventListener('click', () => alert("This is example only."));
        });

        // Any dashboard-specific listeners you previously used
        if (typeof setupDashboardListeners === 'function') setupDashboardListeners();

        function setupTaskDrag() {
            const container = document.querySelector(".task-list");
            if (!container || container.dataset.dragBound) return;

            container.dataset.dragBound = "true";

            container.addEventListener("dragover", e => {
                e.preventDefault();

                const dragging = document.querySelector(".dragging");
                if (!dragging) return;

                const after = getDragAfterElement(container, e.clientY);

                if (after == null) {
                    container.appendChild(dragging);
                } else {
                    container.insertBefore(dragging, after);
                }
                container.addEventListener("drop", () => {
                    saveDashboardOrder();
                });

            });
        }
        renderTasks();        // render items
        setupTaskDrag();   // attach dragover ONCE
        buildMyTasksMobile();
        renderDashboardComments();
    }
    //-----💚MY_TASKS-TABLE💛-----//   
    else if (section === 'my_tasks') {
        // my_tasks view
        contentDiv.innerHTML = `
        <div class = "my-task-container-table">
            <div class="my-tasks-view">
                <h2>Today</h2>
                <div class="my-tasks-table-container">
                    <table class="my-tasks-table">
                        <thead>
                            <tr>
                                <th></th>
                                <th>Tasks</th>
                                <th>Due Date</th>
                                <th>Stage</th>
                                <th>Priority</th>
                                <th>Team</th>
                                <th>Assigne</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody id="myTasksBody"></tbody>
                    </table>
                </div>
            </div>

    <!--------------------✅TOMORROW✅------------------------------------------------------------->
            <div class="my-tasks-view-tomorrow">
                <h2>Tommorow</h2>
                <div class="my-tasks-table-container-tomorrow">
                    <table class="my-tasks-table-tomorrow">
                        <thead>
                            <tr>
                                <th></th>
                                <th>Tasks</th>
                                <th>Due Date</th>
                                <th>Stage</th>
                                <th id = "prio">Priority</th>
                                <th>Team</th>
                                <th>Assigne</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody id="myTasksBodyTomorrow"></tbody>
                    </table>
                </div>
            </div>

    <!--------------------✅NEXT WEEK✅------------------------------------------------------------->            
            <div class="my-tasks-view-this-week">
                <h2>This Week</h2>
                <div class="my-tasks-table-container-this-week">
                    <table class="my-tasks-table-this-week">
                        <thead>
                            <tr>
                                <th></th>
                                <th>Tasks</th>
                                <th>Due Date</th>
                                <th>Stage</th>
                                <th>Priority</th>
                                <th>Team</th>
                                <th>Assigne</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody id="myTasksBodyThisWeek"></tbody>
                    </table>
                </div>
            </div>

    <!--------------------✅NEXT WEEK✅------------------------------------------------------------->            
            <div class="my-tasks-view-next-week">
                <h2>Next Week</h2>
                <div class="my-tasks-table-container-next-week">
                    <table class="my-tasks-table-next-week">
                        <thead>
                            <tr>
                                <th></th>
                                <th>Tasks</th>
                                <th>Due Date</th>
                                <th>Stage</th>
                                <th>Priority</th>
                                <th>Team</th>
                                <th>Assigne</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody id="myTasksBodyNextWeek"></tbody>
                    </table>
                </div>
            </div>
        </div>
        `;

        // render the table (tasks are stored in 'tasks')
        if (typeof window.appRenderMyTasksTable === 'function') window.appRenderMyTasksTable();

        // if dashboard is currently present in the DOM (rare while on my_tasks) then also render it
        safeRenderTasks();
        buildMyTasksMobile();
    }

    // Single attach for profile button listener to avoid duplicates
    const profile_button = document.getElementById('profile_button');
    if (profile_button && !window._profileListenerAdded) {
        profile_button.addEventListener('click', () => {
            contentDiv.innerHTML = `
                <div class="profile-container">

    <!-- FORM -->
    <div class="profile-form">
        <h2>Create Profile</h2>

        <input type="text" id="name" placeholder="Full Name">
        <input type="text" id="department" placeholder="Department">
        <input type="text" id="position" placeholder="Position">
        <input type="email" id="email" placeholder="Email">
        <input type="file" id="photo" accept="image/*">

        <button onclick="saveProfile()">Save Profile</button>
    </div>

    <!-- DISPLAY -->
    <div class="profile-card" id="profileCard">
        <img id="profileImage">
        <div class="profile-info">
            <p><span>Name: </span> <span id="displayName"></span></p>
            <p><span>Department: </span> <span id="displayDepartment"></span></p>
            <p><span>Position: </span> <span id="displayPosition"></span></p>
            <p><span>Email: </span> <span id="displayEmail"></span></p>
        </div>
    </div>

</div>    
            `;
        });
        window._profileListenerAdded = true;
    }
    else if (section === "notifications") {
        console.log("NOTIFICATIONS SECTION LOADED");
        const overlay = createOverlay();
        const notifications = JSON.parse(localStorage.getItem('notifications')) || [];

        const notificationContainer = document.createElement("div");
        notificationContainer.classList.add("notification-container");

        notificationContainer.innerHTML = `
        <div class="notification-header">
            <h2>Notifications</h2>
        </div>
        <div class="notification-list"></div>
    `;

        document.body.appendChild(notificationContainer);

        // ✅ protect from global click listeners
        notificationContainer.addEventListener('click', (e) => e.stopPropagation());

        const list = notificationContainer.querySelector(".notification-list");

        if (notifications.length === 0) {
            list.innerHTML = `<p style="padding:12px;color:#666">No notifications yet</p>`;
        } else {
            notifications.forEach(n => {
                const item = document.createElement("div");
                item.classList.add("notification-content");

                item.innerHTML = `
                <div class = "item-value">
                      <span class="material-symbols-outlined">account_circle</span>
                    </div>
                        <div class = "border-line"></div>
                        <div class="notif-text">
                                 <h4><strong>From: </strong>${n.from}</h4>
                                 <p>Commented on your task.</p>
                                <small>${n.createdAt}</small>
                        </div>
                </div>
            `;

                item.addEventListener('click', (e) => {
                    e.stopPropagation();
                    localStorage.setItem('notifications', JSON.stringify(notifications));
                });

                list.appendChild(item);

            });


        }
        overlay.appendChild(notificationContainer);
    }

    else if (section === "schedule") {
        contentDiv.innerHTML = renderSchedulePage();
    }

    // After all your dashboard setup code (around line 400-ish)
    // NEW
    safeRenderTasks();

    // ADD THIS: Force a small delay to ensure DOM is fully ready
    setTimeout(() => {
        if (typeof window.renderTasks === 'function') window.renderTasks();
        if (typeof updateDeletedChart === 'function') updateDeletedChart();

        // Re-verify button exists
        const btn = document.getElementById('taskListButton');
        console.log('Dashboard loaded. Button exists?', !!btn);
    }, 100); // Increased from 50 to 100

    setupDashboardListeners();


}

//---MAIL--BTN✅---//
mailBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    e.preventDefault();
    const overlay = createOverlay();
    const newMailWindow = document.createElement('div');
    newMailWindow.classList.add("new-mail-window");
    newMailWindow.innerHTML = `
                        <div class = "wrap"> 
                            <aside class = "aside-bar">
                                        <div class = "aside-search">
                                            <input id = "searchInput" class="search_input" type="text" placeholder = "Search. . ."/>
                                        </div>

                                    <div class = "contacts" id = "contactsList" aria-label = "contact list">
                                    <!---✅this area will render contact list✅---->
                                    </div>
                             </aside>

                             <section class="chat-area">
                                <div class = "chat-header" id="chatHeader">
                                    <div class = "chat-header-inside">
                                        <div class = "avatar"><img class = "header-avatar" id = "headerAvatar" src = "assets/1.jpg"/></div>
                                        <div class = "meta">
                                            <h3 id = "headerName">Select a chat</h3>
                                            <p id = "headerStatus">Offline</p>
                                        </div>
                                        <div class = "icons">
                                            <div class = "dot" id = "statusDot" style = "display:none"></div>
                                            <button class = "arrow-back" title="Close chat"><span class="material-symbols-outlined">arrow_back_ios</span></button>
                                            <button class = "icon-btn-call" title = "Call"><span class="material-symbols-outlined">call</span></button>
                                            <button class = "icon-btn-details" title = "More">⋮</button>
                                            <button class = "delete-chat" title= "Delete chat"><span class="material-symbols-outlined">delete</span></button>
                                        </div>
                                    </div>
                                </div>

                                <div class = "messages" id = "messages">
                                <!-- messages rendered --->
                                <div>choose a contact to start chatting</div>
                                </div>

                                <div class = "composer">
                                    <textarea id = "messageInput" rows = "1" placeholder = "type something here...."></textarea>
                                    <div class = "actions">
                                        <button class = "icon-btn" title= "attach">📎</button>
                                        <button class = "icon-btn" title="image">📷</button>
                                        <button class = "send" id ="sendBtn">Send</button>
                                    </div>
                                </div>
                            </div>
                        </section>

                        `;
    // ✅ Prevent clicks inside chat from closing it (mobile fix)

        if (window.innerWidth <= 768) {
        overlay.addEventListener('click', () => {
            document.querySelector('.wrap').classList.remove('chat-open');
         
        });
        }
    newMailWindow.addEventListener('click', (e) => {
        e.stopPropagation();
    });
    const detailsBtn = newMailWindow.querySelector('.icon-btn-details');
    detailsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!activeContactId) return;

        const contact = contacts.find(c => c.id === activeContactId);
        if (!contact || contact.type !== 'group') {
            alert('This is not a group chat');
            return;
        }

        openGroupMembersPopup(contact);
    });

    document.body.appendChild(newMailWindow);
    // ✅ Mobile back button
    const backBtn = newMailWindow.querySelector('.back-btn');

    if (backBtn) {
        backBtn.addEventListener('click', () => {
            document.querySelector('.wrap').classList.remove('chat-open');
        });
    }




    const contacts = getMailContacts();
    const conversations = getMailConversations();



    let activeContactId = null;

    // Query elements after newMailWindow is appended to the DOM
    const contactsListEl = newMailWindow.querySelector('#contactsList');
    const messagesEl = newMailWindow.querySelector('#messages');
    const headerNameEl = newMailWindow.querySelector('#headerName');
    const headerStatusEl = newMailWindow.querySelector('#headerStatus');
    const headerAvatarEl = newMailWindow.querySelector('#headerAvatar');
    const statusDotEl = newMailWindow.querySelector('#statusDot');
    const messageInput = newMailWindow.querySelector('#messageInput');
    const sendBtn = newMailWindow.querySelector('#sendBtn');
    const searchInput = newMailWindow.querySelector('#searchInput');
    const arrowBackBtn = newMailWindow.querySelector('.arrow-back');
    const deleteMessage = newMailWindow.querySelector('.delete-chat');


    if (messageInput) {
        ['focus', 'click', 'touchstart'].forEach(evt => {
            messageInput.addEventListener(evt, (e) => {
                e.stopPropagation();
            });
        });
    }

    arrowBackBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelector('.wrap').classList.remove('chat-open');
    });

    deleteMessage.addEventListener('click', (e) => {
        e.stopPropagation();
        if (document.querySelector('.delete-modal')) return;
        const deleteModal = document.createElement('div');
        deleteModal.className = 'delete-modal';
        deleteModal.innerHTML = `
            <div class="delete-modal-container">
                <p class = "delete-message">This will delete all the message do you want to delete?</p>
                <div class = "delete-container-btn">
                <button class= "deleteYesBtn">Yes</button>
                <button class = "deleteNoBtn">No</button>
                </div>
            </div>
        `;
        document.body.appendChild(deleteModal);
        deleteModal.addEventListener('click', (e) => e.stopPropagation());
        const deleteYesBtn = deleteModal.querySelector('.deleteYesBtn');
        const deleteNoBtn = deleteModal.querySelector('.deleteNoBtn');
        deleteYesBtn.addEventListener('click', () => {
            const conversations = getMailConversations();
            const messages = conversations[activeContactId] || [];
                if(messages.length === 0){
               showToast('No messages to be deleted', 'error');
               deleteModal.remove();
               return;
            }
            if(!conversations[activeContactId]) return;
            delete conversations[activeContactId];
            setMailConversations(conversations);
            renderMessages(activeContactId);
            deleteModal.remove();
            const activeContactEl = contactsListEl.querySelector('[data-id="{activeContactId}"]');
            if(activeContactEl)activeContactEl.remove();
            showToast('Chat deleted successfully', 'success');
        });
        deleteNoBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteModal.remove();
            showToast('Chat not deleted', 'success');
        })
    });

    function timeAgo(timestamp) {
        if(!timestamp) return 'just now';
        const diff = Date.now() - timestamp;
        const minutes = Math.floor(diff/ 60000);

        if(minutes < 1) return 'just now';
        if(minutes < 60) return `${minutes} min ago`;

        const hours = Math.floor(minutes / 60);
        return `${hours} hours ago`;
    }
    function renderContacts(filter = '') {
        contactsListEl.innerHTML = '';
        const term = filter.toLowerCase();
        for (const c of contacts) {
            if (term &&
                !c.name.toLowerCase().includes(term)
            )
                continue;
            const item = document.createElement('div');
            item.className = 'contact' + (c.id === activeContactId ? " active" : "");
            item.dataset.id = c.id;
            item.innerHTML = `
                    <div class="avatar"><img src="${c.images && c.images[0] ? c.images[0] : 'assets/1.jpg'}" alt="${c.name}"/></div>
                    <div class="contact-info">
                        <div style="display:flex;justify-content:space-between;align-items:center">
                        <div class="contact-name">${c.name}</div>
                        <div class="contact-time">10:39 PM</div>
                        </div>
                        <div style="font-size:13px;color:#d7dcf0;margin-top:6px;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                        ${c.last || ''}
                        </div>
                    </div>
                    `;
            item.addEventListener('click', () => {
                setActiveContact(c.id);
                document.querySelector('.wrap').classList.add('chat-open');
            });
            contactsListEl.appendChild(item);
        }
    }
    window.refreshMailContacts = function () {
        renderContacts(searchInput.value);
    };

    function setActiveContact(id) {
        activeContactId = id;
        // highlight selected contact in list
        for (const el of contactsListEl.querySelectorAll('.contact')) {
            el.classList.toggle('active', el.dataset.id === id);

        }
        const contact = contacts.find(x => x.id === id);
        headerNameEl.textContent = contact.name;
        headerAvatarEl.src = (contact.images && contact.images[0]) ? contact.images[0] : 'assets/1.jpg';
        headerStatusEl.textContent = contact.online ? 'Online' : 'Offline';
        statusDotEl.style.display = contact.online ? 'block' : 'none';
        renderMessages(id);
    }

    function renderMessages(contactId) {
        messagesEl.innerHTML = '';
        const conversations = getMailConversations();
        const conv = conversations[contactId] || [];
        // render messages with spacing and avatars
        const contactInfo = contacts.find(c => c.id === contactId) || {};
        const avatarSrc = (contactInfo.images && contactInfo.images[0]) || 'assets/1.jpg';
        for (const m of conv) {
            const row = document.createElement('div');
            row.className = 'msg-row ' + (m.from === 'me' ? 'right' : 'left');
            // Only show avatar for incoming messages to avoid repeating the header avatar
            const avatarHtml = m.from === 'me' ? '' : `<div class="avatar-small"><img src="${avatarSrc}" alt="av"></div>`;
            row.innerHTML = `
                                ${avatarHtml}
                                <div class="bubble ${m.from === 'me' ? 'right' : 'left'}">
                                    ${escapeHtml(m.text)}
                                    <small>${timeAgo(m.timestamp)}</small>
                                </div>
                                `;
            messagesEl.appendChild(row);
        }
        // scroll to bottom
        requestAnimationFrame(() => messagesEl.scrollTop = messagesEl.scrollHeight);
    }
    function escapeHtml(str) {
        return String(str).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
    }


    function sendMessage() {
        const text = messageInput.value.trim();
        if (!text || !activeContactId) return;

        const conversations = getMailConversations();
        if (!conversations[activeContactId]) {
            conversations[activeContactId] = [];
        }

        conversations[activeContactId].push({
            from: 'me',
            text,
            time: Date.now()
        });

        setMailConversations(conversations);
        messageInput.value = '';
        renderMessages(activeContactId);
    }

    function simulateReply(contactId) {
        // create a small simulated reply after 600ms
        setTimeout(() => {
            const conv = conversations[contactId];
            conv.push({ from: 'them', text: "Got it — thanks!", timeOffsetMin: 0 });
            for (let i = 0; i < conv.length - 1; i++) conv[i].timeOffsetMin += 1;
            if (contactId === activeContactId) renderMessages(contactId);
            // also update contact preview text
            const contact = contacts.find(c => c.id === contactId);
            contact.last = 'Got it — thanks!';
            renderContacts(searchInput.value);
        }, 700);
    }

    // keyboard shortcuts
    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // send button
    sendBtn.addEventListener('click', () =>{
        const text = messageInput.value.trim();
        if(!text) return;
        const conversation = getMailConversations();
        if(!conversation[activeContactId]){
            conversation[activeContactId] = [];
        }
        conversation[activeContactId].push({
            text: text,
            from: 'me',
            timestamp: Date.now()
        });

        setMailConversations(conversation);
        renderMessages(activeContactId);
        messageInput.value='';
    });

    // search contacts
    searchInput.addEventListener('input', () => renderContacts(searchInput.value));

    // initial render
    renderContacts();

    // open first contact by default
    setTimeout(() => {
        if (contacts.length) setActiveContact(contacts[0].id);
    }, 200);

    // Close mail window when clicking outside the inner `.wrap` or pressing Escape
    const wrap = newMailWindow.querySelector('.wrap');
    wrap.addEventListener('click', e => e.stopPropagation());
    if (wrap) {
        function closeMailWindow() {
            if (document.body.contains(newMailWindow)) newMailWindow.remove();
            document.removeEventListener('keydown', escHandler);
            document.removeEventListener('click', onDocClick, true);
        }

        function isInsideSafePopup(e) {
            return e.target.closest(
                '.new-mail-window, .wrap, .group-members-popup, .delete-modal'
            );
        }
        function onDocClick(e) {
                if (e.target.closest(
        '.new-mail-window, .wrap, .group-members-popup, .delete-modal'
    )) {
        return;
    }

    closeMailWindow();
        }

        function escHandler(e) {
            if (e.key === 'Escape'){
                overlay.remove();
                closeMailWindow();
            }
        }

        // Listen on document in capture phase so we catch clicks before other handlers
        setTimeout(() => {

    document.addEventListener('keydown', escHandler);
}, 0);

    }
    newMailWindow.addEventListener('click', (e) => e.stopPropagation());
    overlay.appendChild(newMailWindow);

messageInput.addEventListener('mousedown', e => e.stopPropagation());
messageInput.addEventListener('focus', e => e.stopPropagation());
messageInput.addEventListener('keydown', e => e.stopPropagation());

});
//***END-OF-MAIL💚//

function openModal({ className, html, onSubmit, overlay }) {
    // 🛑 Prevent duplicate modals
    if (document.querySelector(`.${className}`)) return;
    const modal = document.createElement('div');
    modal.className = className;
    modal.style.zIndex = '1001';
    modal.innerHTML = html;

    document.body.appendChild(modal);

    const closeBtn = modal.querySelector('.modal-close');
    if (closeBtn) {
        closeBtn.onclick = () => { modal.remove(), overlay?.remove(); };
    }

    // Submit handler
    const form = modal.querySelector('form');
    if (form && onSubmit) {
        form.onsubmit = (e) => {
            e.preventDefault();
            onSubmit({ modal, form });
        };
    }

    return modal;
}

function openAddTaskModal() {
    const overlay = createOverlay();
    openModal({
        className: 'add-task-form',
        overlay,
        html: `
            <form class="addTaskForm">
                <div class="add-task-header">
                    <h3>Name a task</h3>
                    <button type="button" class="modal-close">❌</button>
                </div>

                <label>To Do Task</label>
                <input type="text" class="task-text" placeholder="Name of task?" required />

                <label>Due Date</label>
                <select class="task-due">
                    <option value="Today">Today</option>
                    <option value="Tomorrow">Tomorrow</option>
                    <option value="This Week">This Week</option>
                    <option value="Next Week">Next Week</option>
                </select>

                <label>Stage</label>
                <select class="task-stage">
                    <option value="Inprogress">In progress</option>
                    <option value="Pending">Not started</option>
                    <option value="Finish">Finish</option>
                </select>

                <label>Team</label>
                <select class="task-team">
                    <option value="Marketing">Marketing</option>
                    <option value="Retail">Retail</option>
                    <option value="Development">Development</option>
                    <option value="Operation">Operation</option>
                </select>

                <label>Assignee</label>
                <select class="task-assignee">
                    <option value="John Doe">John Doe</option>
                    <option value="Jane Smith">Jane Smith</option>
                    <option value="Emily Johnson">Emily Johnson</option>
                    <option value="Michael Brown">Michael Brown</option>
                    <option value="Sarah Davis">Sarah Davis</option>
                    <option value="David Wilson">David Wilson</option>
                </select>

                <label>Priority</label>
                <select class="task-priority">
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                </select>

                <button type="submit">Add Task</button>
            </form>
        `,
        onSubmit: ({ modal, form }) => {
            const taskText = form.querySelector('.task-text').value.trim();
            if (!taskText) {
                alert('Please enter a task name');
                return;
            }

            const newTask = {
                id: Date.now(),
                text: taskText,
                dueDate: form.querySelector('.task-due').value,
                stage: form.querySelector('.task-stage').value,
                team: form.querySelector('.task-team').value,
                assignee: form.querySelector('.task-assignee').value,
                priority: form.querySelector('.task-priority').value,
                completed: false
            };

            const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
            tasks.push(newTask);
            localStorage.setItem('tasks', JSON.stringify(tasks));

            modal.remove();

            showToast('Task added successfully!', 'success');

            if (typeof window.appRenderMyTasksTable === 'function') {
                window.appRenderMyTasksTable();
            }
            overlay.remove();
        }


    });
    overlay.appendChild(AddtaskForm);
}

function setupDashboardListeners() {
    console.log('setupDashboardListeners: start. tasks=', JSON.parse(localStorage.getItem('tasks') || '[]').length, 'taskList=', JSON.parse(localStorage.getItem('taskList') || '[]').length);
    const addTaskBtn = document.getElementById("taskButton");
    if (!addTaskBtn) return;

    addTaskBtn.onclick = openAddTaskModal;
}

let myChartInstance = null;

// Make renderTasks available globally and remove the DOMContentLoaded wrapper
window.renderTasks = function () {
    const container = document.querySelector(".task-list");
    const theTask = document.querySelector('.mytasks');
    if (!container) return;

    container.innerHTML = "";

    const tasks = JSON.parse(localStorage.getItem("dashboardTasks")) || [];


    if (tasks.length === 0) {
        container.innerHTML = `<p style="text-align:center; padding:20px;color: #444;">No tasks yet. Click "Add Task" to create one!</p>`;
    }

    tasks.forEach(task => {
        const item = document.createElement("div");
        item.className = "task-item";
        item.dataset.id = task.id;
        item.setAttribute("draggable", "true");


        const pColor =
            task.priority === "High" ? "#dc3545" :
                task.priority === "Medium" ? "#ffc107" :
                    "#28a745";

        item.innerHTML = `
            <div class="check-box-container">
                <input type="checkbox" ${task.completed ? "checked" : ""}
                    onchange="toggleDashboardTask(${task.id})">
                    
                <div class="task-content" style="border-left-color:${pColor}">
                    <span class="task-text">${task.text}</span>
                    <span class="time-stamp">Created: ${task.createdAt || 'N/A'}</span>
                </div>
            </div>
            <button class="delete-task-btn"
                onclick="deleteDashboardTask(${task.id})">
                Done
            </button>
        `;

        // ✅ DRAG START
        item.addEventListener("dragstart", () => {
            console.log("DRAG STARTED");
            item.classList.add("dragging");
        });

        // ✅ DRAG END
        item.addEventListener("dragend", () => {
            item.classList.remove("dragging");
        });

        container.appendChild(item);
    });
};


window.toggleDashboardTask = (id) => {
    const tasks = JSON.parse(localStorage.getItem("dashboardTasks")) || [];
    const task = tasks.find((t) => t.id === id);
    if (task) task.completed = !task.completed;
    localStorage.setItem("dashboardTasks", JSON.stringify(tasks));
    renderTasks();
    updateDeletedChart();
};

window.deleteDashboardTask = (id) => {
    const tasks = JSON.parse(localStorage.getItem("dashboardTasks")) || [];
    const deletedHistory = JSON.parse(localStorage.getItem("deletedDashboardTasks")) || [];

    const index = tasks.findIndex((t) => String(t.id) === String(id));

    if (index > -1) {
        const removed = tasks.splice(index, 1)[0];
        removed.deletedAt = new Date().toLocaleString();
        deletedHistory.push(removed);

        localStorage.setItem("dashboardTasks", JSON.stringify(tasks));
        localStorage.setItem("deletedDashboardTasks", JSON.stringify(deletedHistory));

        console.log('Dashboard task deleted. Remaining:', tasks.length, 'Deleted total:', deletedHistory.length);
    }

    renderTasks();
    updateDeletedChart();
};

window.updateDeletedChart = function () {
    const canvas = document.getElementById("deletedChart");
    if (!canvas) {
        console.warn('updateDeletedChart: canvas not found');
        return;
    }

    // Uses dashboardTasks for chart
    const tasks = JSON.parse(localStorage.getItem("dashboardTasks")) || [];
    const deleted = JSON.parse(localStorage.getItem("deletedDashboardTasks")) || [];

    const pendingCount = tasks.filter((t) => !t.completed).length;
    const deletedCount = deleted.length;

    console.log('Chart Update - Pending:', pendingCount, 'Deleted:', deletedCount, 'Total dashboard tasks:', tasks.length);

    if (myChartInstance) {
        myChartInstance.destroy();
        myChartInstance = null;
    }

    const ctx = canvas.getContext("2d");
    myChartInstance = new Chart(ctx, {
        type: "bar",
        data: {
            labels: ["Tasks Done", "Pending Tasks"],
            datasets: [{
                label: "Task Volume",
                data: [deletedCount, pendingCount],
                backgroundColor: ["#4dff53", "#36a2eb"],
                borderRadius: 5,
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1 }
                }
            },
        },
    });

    console.log('Chart rendered successfully');
};

// 4. Debug localStorage
const dashboardData = JSON.parse(localStorage.getItem('dashboardTasks')) || [];
const myTasksData = JSON.parse(localStorage.getItem('tasks')) || [];
const deletedData = JSON.parse(localStorage.getItem('deletedDashboardTasks')) || [];

console.log('LocalStorage Data:', {
    dashboardTasks: dashboardData.length,
    myTasks: myTasksData.length,
    deletedDashboard: deletedData.length
});

// 5. Load dashboard
loadContent("dashboard");

// 6. Initialize chart
let attempts = 0;
const maxAttempts = 20;

const initializeChart = setInterval(() => {
    attempts++;
    const canvas = document.getElementById('deletedChart');
    const taskList = document.querySelector('.task-list');

    console.log(`Attempt ${attempts}: Canvas=${!!canvas}, TaskList=${!!taskList}`);

    if (canvas && taskList) {
        console.log('✅ Both elements found! Initializing...');
        clearInterval(initializeChart);

        renderTasks();

        setTimeout(() => {
            updateDeletedChart();
            console.log('=== INITIALIZATION COMPLETE ===');
        }, 200);
    } else if (attempts >= maxAttempts) {
        console.error('❌ Timeout: Could not find required elements');
        clearInterval(initializeChart);
    }
}, 100);


document.addEventListener('click', function (e) {
    const button = e.target.closest('#taskListButton');
    if (!button) return;

    e.preventDefault();
    e.stopPropagation();

    console.log('🎯 Task button clicked!');

    // Small delay to ensure any pending DOM operations complete
    requestAnimationFrame(() => {
        // Remove any existing modals first
        document.querySelectorAll('.add-my-task-div').forEach(m => m.remove());

        const modal = document.createElement("div");
        const overlay = createOverlay();
        modal.className = "add-my-task-div";
        modal.innerHTML = `
            <div class="modal-content">
                <h4 style="margin:0">New Dashboard Task</h4>
                <textarea id="taskInput" placeholder="What needs to be done?"></textarea>
                <select id="taskPrio" class="task-priority">
                    <option value="Low">Low Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="High">High Priority</option>
                </select>
                <div class="btn-group">
                    <button id="saveBtn">Save</button>
                    <button id="cancelBtn">Cancel</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        console.log('✅ Modal appended to body');
        overlay.appendChild(modal);

        // Prevent clicks inside modal from closing it
        modal.querySelector('.modal-content').addEventListener('click', function (e) {
            e.stopPropagation();
        });

        // Save button handler
        modal.querySelector("#saveBtn").addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();

            console.log('💾 Save clicked');

            const text = modal.querySelector("#taskInput").value;
            const prio = modal.querySelector("#taskPrio").value;

            if (text.trim()) {
                const tasks = JSON.parse(localStorage.getItem("dashboardTasks")) || [];
                tasks.push({
                    id: Date.now(),
                    text: text,
                    priority: prio,
                    completed: false,
                    createdAt: new Date().toLocaleString(),
                });
                localStorage.setItem("dashboardTasks", JSON.stringify(tasks));
                console.log('✅ Task saved!', tasks.length);

                // Update UI
                if (typeof renderTasks === 'function') renderTasks();
                if (typeof updateDeletedChart === 'function') updateDeletedChart();
            }
            modal.remove();
            overlay.remove();
        });

        // Cancel button handler
        modal.querySelector("#cancelBtn").addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('❌ Cancel clicked');
            modal.remove();
            overlay.remove();
        });

        // Click outside to close
        modal.addEventListener('click', function (e) {
            if (e.target === modal) {
                console.log('🚪 Clicked outside, closing');
                modal.remove();
            }
        });

        // Focus textarea
        setTimeout(() => {
            const input = modal.querySelector('#taskInput');
            if (input) {
                input.focus();
                console.log('✅ Input focused');
            }
        }, 100);
    });
}); // Use capture phase to catch events early

function updateDeletedChart() {
    const canvas = document.getElementById("deletedChart");
    if (!canvas) {
        console.warn('updateDeletedChart: canvas not found');
        return;
    }

    // Always fetch fresh data from localStorage
    const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    const deleted = JSON.parse(localStorage.getItem("deletedTasks")) || [];

    // Count pending (incomplete) tasks
    const pendingCount = tasks.filter((t) => !t.completed).length;
    const deletedCount = deleted.length;

    console.log('updateDeletedChart: pending=', pendingCount, 'deleted=', deletedCount, 'tasksTotal=', tasks.length);

    // Destroy old chart to prevent "ghosting"
    if (myChartInstance) {
        myChartInstance.destroy();
        myChartInstance = null;
    }

    const ctx = canvas.getContext("2d");
    myChartInstance = new Chart(ctx, {
        type: "bar",
        data: {
            labels: ["Done Tasks", "Pending Tasks"],
            datasets: [{
                label: "Task Volume",
                data: [deletedCount, pendingCount],
                backgroundColor: ["#29d50a", "#36a2eb"],
                borderRadius: 5,
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1 }
                }
            },
        },
    });
}
// End of the Chart

// Top-level My Tasks table renderer (used by loadContent('my_tasks'))
window.appRenderMyTasksTable = function () {
    const bodyToday = document.getElementById('myTasksBody');
    const bodyTomorrow = document.getElementById('myTasksBodyTomorrow');
    const bodyThisWeek = document.getElementById('myTasksBodyThisWeek');
    const bodyNextWeek = document.getElementById('myTasksBodyNextWeek');
    if (!bodyToday && !bodyTomorrow && !bodyThisWeek && !bodyNextWeek) return;
    if (bodyToday) bodyToday.innerHTML = '';
    if (bodyTomorrow) bodyTomorrow.innerHTML = '';
    if (bodyThisWeek) bodyThisWeek.innerHTML = '';
    if (bodyNextWeek) bodyNextWeek.innerHTML = '';
    const savedTasks = JSON.parse(localStorage.getItem('tasks')) || [];
    console.log('appRenderMyTasksTable: loaded', savedTasks.length, 'tasks', savedTasks);

    const todayList = [];
    const tomorrowList = [];
    const thisWeekList = [];
    const nextWeekList = [];
    const otherList = [];

    savedTasks.forEach(task => {
        const s = (task.schedule || task.dueDate || '').toString().toLowerCase();
        if (s.includes('today')) todayList.push(task);
        else if (s.includes('tomorrow')) tomorrowList.push(task);
        else if (s.includes('this week')) thisWeekList.push(task);
        else if (s.includes('next week')) nextWeekList.push(task);
        else otherList.push(task);
    });

    function makeRow(task) {
        const row = document.createElement('tr');
        row.dataset.id = task.id;

        const checkboxCell = document.createElement('td');
        const checkboxes = document.createElement('input');
        checkboxes.type = 'checkbox';
        checkboxes.checked = task.completed || false;
        checkboxCell.appendChild(checkboxes);

        const textCell = document.createElement('td');
        textCell.textContent = task.text || '';
        textCell.style.cursor = "pointer";

        textCell.addEventListener('click', () => {
            openCommentPopup(task.id, task.text);
        });


        const dueCell = document.createElement('td');
        dueCell.textContent = task.dueDate || task.schedule || '';

        const stageCell = document.createElement('td');
        stageCell.textContent = task.stage || '';

        const priorityCell = document.createElement('td');
        priorityCell.textContent = task.priority || '';

        const teamCell = document.createElement('td');
        teamCell.textContent = task.team || '';

        const assigneeCell = document.createElement('td');
        assigneeCell.textContent = task.assignee || '';

        const delCell = document.createElement('td');
        const delBtn = document.createElement('button');
        delBtn.classList.add('delete-table');
        delBtn.innerHTML = '<span class="material-symbols-outlined">delete</span>';
        delCell.appendChild(delBtn);

        checkboxes.addEventListener("change", () => {
            const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
            const idx = tasks.findIndex(t => String(t.id) === String(task.id));

            if (idx > -1) {
                tasks[idx].completed = !!checkboxes.checked;
                localStorage.setItem('tasks', JSON.stringify(tasks));
            }

            requestAnimationFrame(() => {
                if (typeof window.appRenderMyTasksTable === 'function') window.appRenderMyTasksTable();
                if (typeof window.renderTasks === 'function') window.renderTasks();
                updateDeletedChart();
            });
        });

        delBtn.addEventListener('click', () => {
            const cur = JSON.parse(localStorage.getItem('tasks')) || [];
            const i = cur.findIndex(t => t.id === task.id);
            if (i > -1) {
                cur.splice(i, 1);
                localStorage.setItem('tasks', JSON.stringify(cur));
            }
            window.appRenderMyTasksTable();
            showToast('Task deleted', 'success');
        });

        row.appendChild(checkboxCell);
        row.appendChild(textCell);
        row.appendChild(dueCell);
        row.appendChild(stageCell);
        row.appendChild(priorityCell);
        row.appendChild(teamCell);
        row.appendChild(assigneeCell);
        row.appendChild(delCell);

        return row;
    }

    if (bodyToday) {
        todayList.forEach(t => bodyToday.appendChild(makeRow(t)));
        otherList.forEach(t => bodyToday.appendChild(makeRow(t)));
    }
    if (bodyTomorrow) {
        tomorrowList.forEach(t => bodyTomorrow.appendChild(makeRow(t)));
    }
    if (bodyThisWeek) {
        thisWeekList.forEach(t => bodyThisWeek.appendChild(makeRow(t)));
    }
    if (bodyNextWeek) {
        nextWeekList.forEach(t => bodyNextWeek.appendChild(makeRow(t)));
    }

}

//-----------✅CATEGORIES----------//
// const addBtn = document.getElementById("addBtn");
function createGroupChat(groupName, members) {
    const contacts = getMailContacts();
    const conversations = getMailConversations();

    const groupId = "group_" + Date.now();

    contacts.push({
        id: groupId,
        name: groupName,
        type: "group",
        members: members.map(m => m.id),
        images: ["assets/group-icons.jpg"]
    });

    conversations[groupId] = [];

    setMailContacts(contacts);
    setMailConversations(conversations);
}

function openCategoryModal() {
    if (document.querySelector('.popDiv')) return;
    const overlay = createOverlay();
    const newDiv = document.createElement('div');
    newDiv.classList.add("popDiv");
    newDiv.innerHTML = `
    <div class="new-div-container">
      <div class="new-div-header">
          <h3>Add Group</h3>
          <button class ="closeBtn">❌</button> 
      </div>
      <div class="new-div-group-input">
        <label>Name of the group: </label>
        <input type="text" id="groupName" placeholder="Enter a group name"/>
      </div>
      <div class="new-div-employee">
        <div class="employee-header">
          <h4>Employees</h4>
          <button id="addEmployee" class = "add-employee">Add Employee</button>
        </div>
        <ul class="employeeListContainer"></ul>
        <button id="collectThemAll" class = "save-group">Save Group</button>
      </div>
    </div>
  `;
    newDiv.querySelector('#collectThemAll').addEventListener('click', () => {
        const groupName = document.getElementById('groupName').value.trim();

        const selectedEmployees = [];
        newDiv.querySelectorAll('.employee-row').forEach((row, index) => {
            const checkbox = row.querySelector('.checkbox');
            if (checkbox && checkbox.checked) {
                selectedEmployees.push(theEmployee[index]);
            }
        });

        if (selectedEmployees.length === 0) {
            alert('Select at least one employee');
            return;
        }

        createGroupChat(groupName, selectedEmployees);

        newDiv.remove();
        overlay.remove();
    });

    document.body.appendChild(newDiv);

    newDiv.querySelector('.closeBtn').onclick = () => { newDiv.remove(), overlay.remove(); };

    const addEmployeeBtn = newDiv.querySelector("#addEmployee");
    const addEmployeeHere = newDiv.querySelector('.employeeListContainer');

    // --- Add Employee Form ---
    addEmployeeBtn.addEventListener('click', () => {
        if (!document.getElementById('dynamicForm')) {
            const form = document.createElement("form");
            form.id = "dynamicForm";
            form.innerHTML = `
        <div class = "form-div">
        <h2>Add Employee</h2>
        <label>Name</label>
        <input type="text" class="name" placeholder="Name"/>
        <label>Department</label>
        <select class="department">
          <option value="Marketing">Marketing</option>
          <option value="Engineering">Engineering</option>
          <option value="Executive">Executive</option>
          <option value="Operations">Operations</option>
        </select>
        <label>Position</label>
            <input type="text" class="position"/>
        <label>Email</label>
        <input type="email" class="email" placeholder="Email..."/>
            <div class="form-buttons">
                <button type="submit" id="saveBtn" class = "save-button">Save</button>
                <button type="button" class="closeAddEmp">Close</button>
            </div>
        </div>
        `;
            overlay.remove();
            document.body.appendChild(form);
            form.querySelector('.closeAddEmp').addEventListener('click', () => form.remove());
            form.querySelector('#saveBtn').addEventListener('click', (e) => {
                e.preventDefault();

                const name = form.querySelector('.name').value.trim();
                const department = form.querySelector('.department').value.trim();
                const position = form.querySelector('.position').value.trim();
                const email = form.querySelector('.email').value.trim();

                if (!name || !department || !position || !email) {
                    alert('Fill in all fields');
                    return;
                }

                const employee = {
                    id: "emp_" + Date.now(),
                    name,
                    department,
                    position,
                    email
                };

                theEmployee.push(employee);

                // add to mail
                const contacts = getMailContacts();
                contacts.push({
                    id: employee.id,
                    name: employee.name,
                    type: "user",
                    online: true,
                    images: ["assets/1.jpg"]
                });
                setMailContacts(contacts);

                updateEmployeeList();

                // refresh mail if open
                if (typeof window.refreshMailContacts === 'function') {
                    window.refreshMailContacts();
                }

                form.remove();
            });

        }
    });

    // --- ✅Update Employee Table ---
    function updateEmployeeList() {
        addEmployeeHere.innerHTML = "";

        const employeeTableContainer = document.createElement('div');
        employeeTableContainer.classList.add("employeeTableContainer");

        const table = document.createElement('table');
        table.classList.add('employee-table');

        const thead = document.createElement('thead');
        thead.innerHTML = `
                                    <tr>
                                        <th>Name</th>
                                        <th>Department</th>
                                        <th>Position</th>
                                        <th>Email</th>
                                        <th>Select</th>
                                        <th>Delete</th>
                                    </tr>
                                    `;
        employeeTableContainer.appendChild(table)
        table.appendChild(thead);
        const tbody = document.createElement('tbody');

        theEmployee.forEach((emp, index) => {
            if (!emp.id) {
                emp.id = "emp_" + Date.now() + Math.random().toString(36).slice(2);
            }
            const row = document.createElement('tr');
            row.classList.add('employee-row');
            row.innerHTML = `
    <td><input type="checkbox" class="checkbox"/></td>
    <td><span class="cell-value">${emp.name}</span></td>
    <td><span class="cell-value">${emp.department}</span></td>
    <td><span class="cell-value">${emp.position}</span></td>
    <td><span class="cell-value email">${emp.email}</span></td>
    <td>
      <button class="deleteEmpBtn"  style="background: none; border: none; outline: none; cursor: pointer; color: red;">
        <span class="material-symbols-outlined">delete</span>
      </button>
    </td>
      `;
            row.querySelector(".deleteEmpBtn").addEventListener('click', () => {
                theEmployee.splice(index, 1);
                updateEmployeeList();
            });
            tbody.appendChild(row);
        });

        table.appendChild(tbody);
        addEmployeeHere.appendChild(employeeTableContainer);
    }
    updateEmployeeList();

    // ---✅Save Group with Checked Employees ---
    const buttonGet = newDiv.querySelector("#collectThemAll");
    buttonGet.addEventListener('click', (e) => {
        e.preventDefault();
        const groupName = newDiv.querySelector("#groupName").value.trim();
        if (!groupName) {
            alert("Please enter a group name!");
            return;
        }

        const checkboxes = addEmployeeHere.querySelectorAll('.checkbox');
        const selectedEmployees = [];

        checkboxes.forEach((checkbox, index) => {
            if (checkbox.checked) {
                selectedEmployees.push(theEmployee[index]);
            }

        });

        const newGroup = {
            name: groupName,
            employees: selectedEmployees
        };

        allGroups.push(newGroup);
        displayGroup(newGroup);

        newDiv.remove();
        overlay.remove();
    });

    // --- ✅Display Group in Categories ---
    function displayGroup(group) {
        const container = document.querySelector(".categories-container");
        const newGroupDiv = document.createElement("div");
        newGroupDiv.classList.add("newGroup");
        newGroupDiv.innerHTML = `
            <div class="new-group-inside">
                <div>
                <span class="material-symbols-outlined">groups</span>
                <span class="spanName">${group.name}</span>
                </div>
                <div>
                <button class="button-profile" style = "border:none; outline:none; background: none; color: black;"><span class="material-symbols-outlined">more_vert</span></button>   
                </div>
            </div>
        
            `;

        container.appendChild(newGroupDiv);

        const viewBtn = newGroupDiv.querySelector(".button-profile");
        viewBtn.addEventListener("click", (e) => {
            e.stopPropagation();

            const existingView = newGroupDiv.querySelector('.viewBtnDiv');
            if (existingView) {
                existingView.remove();
                document.removeEventListener('click', hideViewHandler);
                return;
            }

            function hideViewHandler(e) {//✅when you click outside the div.
                if (!view.contains(e.target) && e.target !== viewBtn) {
                    view.remove();
                    document.removeEventListener('click', hideViewHandler);
                }
            }

            const view = document.createElement('div');
            view.classList.add('viewBtnDiv');
            view.innerHTML = `
            <a href = "#" class = 'member'> Members </button>
            <a href = "#" class = 'add-member'> Add Member </a>
            <a href = "#" class = 'delete'> Delete Group </a>
        `;
            newGroupDiv.appendChild(view);

            const employees = group.employees;
            const membersDiv = document.createElement('div');
            //✅add kick//
            const renderEmployees = () => {
                const employeeList = employees.map((emp, index) => `
                    <div class = "employee-items">
                    ${emp.name} (${emp.position}, ${emp.department})
                    <button class = "message" data-index = "${index}">Message</button>
                    <button class="kick" data-index="${index}">Kick</button>
                    </div>
                `).join('<br>');

                membersDiv.innerHTML = `
                    <strong>${group.name}</strong>
                    <br>
                    ${employeeList}
                `;

                // Attach event listeners for all Kick buttons
                const kickBtns = membersDiv.querySelectorAll('.kick');
                kickBtns.forEach(button => {
                    button.addEventListener('click', () => {
                        const index = button.getAttribute('data-index');
                        employees.splice(index, 1); // remove the employee
                        renderEmployees(); // re-render the updated list
                        if (employees.length === 0) {
                            membersDiv.remove();

                            alert(`${group.name} has no more members😊`);
                            return;
                        }
                    });
                });
                const messageBtns = membersDiv.querySelectorAll('.message');
                messageBtns.forEach(button => {
                    button.addEventListener('click', () => {
                        const emp = employees[button.getAttribute('data-index')];
                        openMessagePopup(emp);
                    });
                });
            };
            function openMessagePopup(emp) {
                const popupMsg = document.createElement('div');
                popupMsg.classList.add('popup');
                popupMsg.innerHTML = `
                    <div class="popup-content">
                        <h3>Message ${emp.name}</h3>
                        <textarea id="messageText" placeholder="Type your message..."></textarea>
                        <div class="popup-buttons">
                            <button id="sendMsg">Send</button>
                            <button id="closeMsgPopup">Cancel</button>
                        </div>
                    </div>
                `;
                document.body.appendChild(popupMsg);
                popupMsg.querySelector('#sendMsg').addEventListener('click', () => {
                    const message = popupMsg.querySelector('#messageText').value.trim();
                    if (message) {
                        myToast.textContent = `Message was sent to ${emp.name} ✅`;
                        popupMsg.remove();

                        myToast.classList.add("show");
                        setTimeout(() => {
                            myToast.classList.remove("show");
                        }, 5000);
                    } else {
                        alert('Please type a message before sending.');
                    }
                });
                membersDiv.remove();
                popupMsg.querySelector('#closeMsgPopup').addEventListener('click', () => popupMsg.remove());
            }
            const members = view.querySelector('.member');
            members.addEventListener('click', (e) => {
                e.preventDefault();
                const employees = group.employees;
                membersDiv.classList.add('members-div');//▶ClassName
                if (employees.length === 0) {
                    members.style.opacity = "0.5";
                    members.style.pointerEvents = "none";
                    alert(`No members in ${group.name}`);
                    view.remove();
                    return;
                }
                membersDiv.classList.add('members-div');
                document.body.appendChild(membersDiv);
                renderEmployees();
                view.remove();
            });
            // ✅ADD-MEMBER //
            function openAddMemberPopup() {
                const popup = document.createElement('div');
                popup.classList.add('popup');
                popup.innerHTML = `
                        <div class="add-member-popup-content">
                            <h3>Add New Member</h3>
                            <input type="text" id="empName" placeholder="Name">
                            <input type="text" id="empPosition" placeholder="Position">
                            <input type="text" id="empDepartment" placeholder="Department">
                            <div class="popup-buttons">
                                <button id="addMemberConfirm">Add</button>
                                <button id="closePopup">Cancel</button>
                        </div>
                        </div>
                    `;

                document.body.appendChild(popup);

                popup.querySelector('#addMemberConfirm').addEventListener('click', () => {
                    const name = popup.querySelector('#empName').value.trim();
                    const position = popup.querySelector('#empPosition').value.trim();
                    const department = popup.querySelector('#empDepartment').value.trim();

                    if (name && position && department) {
                        employees.push({ name, position, department });
                        renderEmployees();
                        popup.remove();
                    } else {
                        alert('Please fill in all the fields');
                    }
                    renderEmployees();
                });
                popup.querySelector('#closePopup').addEventListener('click', () => popup.remove());
            }

            view.querySelector('.add-member').addEventListener('click', (e) => {
                e.preventDefault();
                openAddMemberPopup();
                view.remove();
            });
            // ✅DELETE GROUP NEW GROUP DIV//
            const deletGroup = view.querySelector('.delete');
            deletGroup.addEventListener('click', (e) => {
                e.preventDefault();
                newGroupDiv.remove();
            });
            // Wait for the current click event to finish bubbling
            setTimeout(() => {
                document.addEventListener('click', hideViewHandler);
            }, 0);
        })
    }
    newDiv.addEventListener('click', (e) => e.stopPropagation());
    overlay.appendChild(newDiv);

};

// ADD TRACK✅//
const addTrack = document.getElementById("addTrack");
function openTrackingModal() {
    if (document.querySelector('.track-container')) return;
    const trackContainer = document.createElement('div');
    const overlay = createOverlay();
    trackContainer.classList.add('track-container');//Css name
    trackContainer.innerHTML = `
            <div class= "inner-track">
                <label>Hours:</label>
                <input type = "number" id = "hours" min = "0" value = "0">
                <label>Minutes:</label>
                <input type = "number" id = "minutes" min = "0" value = "0">
                <label>Seconds:</label>
                <input type = "number" id = "seconds" min = "0" value = "0">
                <label>Track my task</label>
                <textarea id = "taskDiscription" class = "discript" type = "text" placeholder = "Add tasks to track. . ."></textarea>
                <div class = "track-btns">
                    <button class="save-task">Save</button>
                    <button class="close-task">Close</button>
                </div>
            </div>
        `;
    document.body.appendChild(trackContainer);
    trackContainer.querySelector('.close-task').onclick = () => {trackContainer.remove(), overlay.remove()};
    overlay.appendChild(trackContainer);


    const newTrack = document.querySelector('.track-categories');
    const saveTask = trackContainer.querySelector(".save-task");
    saveTask.addEventListener('click', () => {
        const discription = document.getElementById("taskDiscription").value;
        const h = parseInt(document.getElementById("hours").value) || 0;
        const m = parseInt(document.getElementById("minutes").value) || 0;
        const s = parseInt(document.getElementById("seconds").value) || 0;
        const newTrackList = document.createElement("div");
        if (h === 0 && m === 0 && s === 0) {
            alert("Please set a valid time duration.");
            return;
        }
        newTrackList.classList.add('trackList');
        newTrackList.innerHTML = `
                <p class ="time-text">
                <span class = "material-symbols-outlined">timer</span>
                ${discription} - <span class = "time-left"></span>
                </p>
                <div class = "progress-container">
                    <span class = "progress-bar"></span>
                </div>
                <div class="track-controls-div2">
                <button class = "control-btn"><span class="material-symbols-outlined" style="color:black;">play_arrow</span></button>
                <button class = "control-del"><span class="material-symbols-outlined" style="color:black;">delete</span></button>
                </div>
                `;
        newTrack.appendChild(newTrackList);
        const timeLeftE1 = newTrackList.querySelector('.time-left');
        const progressBar = newTrackList.querySelector('.progress-bar');
        const controlBtn = newTrackList.querySelector('.control-btn');
        const controlDel = newTrackList.querySelector('.control-del');

        const duration = (h * 3600 + m * 60 + s) * 1000;
        let elapsed = 0;
        let isPaused = false;
        let startTime = Date.now();
        const updateTimer = () => {
            if (isPaused) {
                elapsed = Date.now() - startTime;
            }
            const remaining = Math.max(duration - elapsed, 0);
            const progress = Math.min((elapsed / duration) * 100, 100);

            const rh = Math.floor(remaining / (1000 * 60 * 60));
            const rm = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
            const rs = Math.floor((remaining % (1000 * 60)) / 1000);

            timeLeftE1.textContent = remaining > 0 ? `Time left ${rh}h ${rm}m ${rs}s` : "✅Time's up";
            progressBar.style.width = progress + "%";
        };
        const timer = setInterval(() => {
            if (elapsed >= duration) {
                clearInterval(timer);
                progressBar.style.width = "100%";
            } else {
                updateTimer();
            }
        }, 1000);

        controlBtn.addEventListener('click', () => {
            console.log('CLICKED');
            if (isPaused) {
                startTime = Date.now() - elapsed;
                controlBtn.innerHTML = `<span class="material-symbols-outlined">play_circle</span>`;
            } else {
                controlBtn.innerHTML = `<span class="material-symbols-outlined">pause</span>`;
            }
            isPaused = !isPaused;

        });
        controlDel.addEventListener('click', () => {
            showToast('Tracked task deleted', 'success');
            newTrackList.remove();
        });

        document.querySelector('.track-container')?.remove();
        overlay.remove();
    });
    trackContainer.addEventListener('click', (e) => e.stopPropagation());
    overlay.appendChild(trackContainer);

};
const addComment = document.querySelector(".add-comment");
const addnewComment = document.querySelector(".comments");



window.onload = function () {
    console.log('Page loaded - initializing app');
    try {
        const rawTasks = localStorage.getItem('tasks');
        const rawDeleted = localStorage.getItem('deletedTasks');
        console.log('LocalStorage state:', {
            tasksCount: rawTasks ? JSON.parse(rawTasks).length : 0,
            deletedCount: rawDeleted ? JSON.parse(rawDeleted).length : 0
        });
    } catch (e) {
        console.warn('Failed to read LocalStorage:', e);
    }

    // 4. Load dashboard content
    loadContent("dashboard");

};

