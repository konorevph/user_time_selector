const _users = [
    {id: 1, start: '2024-07-22 09:00', end: '2024-07-22 11:00', name: "John Psina"},
    {id: 2, start: '2024-07-22 10:00', end: '2024-07-22 16:00', name: "Bill Gayts"},
    {id: 3, start: '2024-07-22 11:00', end: '2024-07-22 13:00', name: "Edward Callin"},
    {id: 1, start: '2024-07-22 12:00', end: '2024-07-22 14:00', name: "John Psina"},
];
const _users2 = [
    {id: 2, start: '2024-07-22 12:00', end: '2024-07-22 17:00', name: "Bill Gayts"},
    {id: 3, start: '2024-07-22 12:00', end: '2024-07-22 13:00', name: "Edward Callin"},
    {id: 1, start: '2024-07-22 12:00', end: '2024-07-22 14:00', name: "John Psina"},
    {id: 3, start: '2024-07-22 16:00', end: '2024-07-22 20:00', name: "Edward Callin"}
];

const _process = {id: 1, start: '2024-07-22 09:00:00', end: '2024-07-22 16:00:00'};
const _process2 = {id: 2, start: '2024-07-22 12:00:00', end: '2024-07-22 20:00:00'};

const tooltip = document.getElementById('tooltip');

function timeToMinutes(time) {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
}

function dateToTimeString(date) {
    let hours = date.getHours().toString().padStart(2, '0');
    let minutes = date.getMinutes().toString().padStart(2, '0');

    return `${hours}:${minutes}`;
}

function tooltipEventListener(event) {
    let start = new Date(event.target.getAttribute('data-start'));
    let end = new Date(event.target.getAttribute('data-end'));
    tooltip.innerText = `${dateToTimeString(start)} --- ${dateToTimeString(end)}`;
    tooltip.style.display = 'block';
    let rect = event.target.getBoundingClientRect();
    tooltip.style.left = `${rect.left + (rect.width / 2)}px`;
    tooltip.style.top = `${rect.top + window.scrollY - tooltip.offsetHeight}px`;

    event.target.addEventListener('mouseleave', () => {
        tooltip.style.display = 'none';
    });
}

function createTimeBlock(process, user) {
    let processStart = new Date(process.start);
    let processEnd = new Date(process.end);
    let total = processEnd - processStart;
    let start = new Date(user.start);
    let end = new Date(user.end);
    let duration = end - start;
    let percentageStart = ((start - processStart) / total) * 100;
    let percentageDuration = (duration / total) * 100;

    let timeBlock = document.createElement('div');
    timeBlock.className = 'time-block';
    timeBlock.style.left = `${percentageStart}%`;
    timeBlock.style.width = `${percentageDuration}%`;
    timeBlock.dataset.userId = user.id;
    timeBlock.dataset.start = user.start;
    timeBlock.dataset.end = user.end;

    timeBlock.addEventListener('click', () => {
        if (timeBlock.classList.contains('disabled')) return;

        if (timeBlock.classList.contains('selected')) {
            timeBlock.classList.remove('selected');
            enableOverlappingBlocks(timeBlock);
        } else {
            timeBlock.classList.add('selected');
            disableOverlappingBlocks(timeBlock);
        }
    });

    timeBlock.addEventListener('mouseenter', tooltipEventListener);

    return timeBlock; 
}

function enableOverlappingBlocks(timeBlock) {
    let user = {
        id: timeBlock.dataset.userId,
        start: timeBlock.dataset.start,
        end: timeBlock.dataset.end
    }

    let processId = timeBlock.closest('tr').dataset.processId;

    let processBlocks = timeBlock.closest('.user-bars').querySelectorAll(`li:not([data-user-id="${user.id}"])>.time-block.disabled`);
    processBlocks.forEach(block => {
        enableBlockByUser(block, user);
    });

    outerBlocks = document.querySelectorAll(`tr:not([data-process-id="${processId}"]) li[data-user-id="${user.id}"]>.time-block.disabled`);
    outerBlocks.forEach(block => {
        enableBlockByUser(block, user);
    });
}

function enableBlockByUser(block, user) {
    let start = block.dataset.start;
    let end = block.dataset.end;
    let id = block.dataset.userId;

    let container = block.parentElement;
    
    let processBar = block.closest('.user-selector').querySelector('.process-bar');
    let process = {
        id: processBar.closest('tr').dataset.processId,
        start: processBar.dataset.start,
        end: processBar.dataset.end
    }

    if (start >= user.end || end <= user.start) return;

    if (user.end > process.end) user.end = process.end;
    if (user.start < process.start) user.start = process.start;
    
    if (start >= user.start && end <= user.end) {
        block.classList.remove('disabled');
        connectAdjacentBlocks(block);
        return;
    }

    if (start >= user.start && end > user.end) {
        let disabledBlock = createTimeBlock(process, {id: id, start: user.end, end: end});
        disabledBlock.classList.add('disabled');
        let newBlock = createTimeBlock(process, {id: id, start: start, end: user.end})

        container.appendChild(disabledBlock);
        container.appendChild(newBlock);

        connectAdjacentBlocks(newBlock);

    } else if (start < user.start && end <= user.end) {
        let disabledBlock = createTimeBlock(process, {id: id, start: start, end: user.start});
        disabledBlock.classList.add('disabled');
        let newBlock = createTimeBlock(process, {id: id, start: user.start, end: end});

        container.appendChild(disabledBlock);
        container.appendChild(newBlock);

        connectAdjacentBlocks(newBlock);
        
    } else {
        let disabledBlock1 = createTimeBlock(process, {id: id, start: start, end: user.start});
        disabledBlock1.classList.add('disabled');
        let disabledBlock2 = createTimeBlock(process, {id: id, start: user.end, end: end});
        disabledBlock2.classList.add('disabled');
        let newBlock = createTimeBlock(process, {id: id, start: user.start, end: user.end});

        container.appendChild(disabledBlock1);
        container.appendChild(disabledBlock2);
        container.appendChild(newBlock);
        disableIntersectionWithSelected(newBlock);
    }

    container.removeChild(block);
}

function disableIntersectionWithSelected(block)
{
    let processId = block.closest('tr').dataset.processId;

    let processBlocks = block.closest('.user-bars').querySelectorAll(`li:not([data-user-id="${block.dataset.userId}"])>.time-block.selected`);

    processBlocks.forEach(selectedBlock => {
        let user = {
            start: selectedBlock.dataset.start,
            end: selectedBlock.dataset.end,
            id: selectedBlock.dataset.userId
        }
        disableBlockByUser(block, user);
    });

    let outerBlocks = document.querySelectorAll(`tr:not([data-process-id="${processId}"]) li[data-user-id="${block.dataset.userId}"]>.time-block.selected`);
    outerBlocks.forEach(selectedBlock => {
        let user = {
            start: selectedBlock.dataset.start,
            end: selectedBlock.dataset.end,
            id: selectedBlock.dataset.userId
        }
        disableBlockByUser(block, user);
    });

    return block;
}

function connectAdjacentBlocks(block) {
    let user = {
        id: block.dataset.userId,
        start: block.dataset.start,
        end: block.dataset.end
    }
    let container = block.parentElement;

    let nextBlock = container.querySelector(`.time-block[data-start="${user.end}"]`);
    if (!areClassesEqual(block, nextBlock))
        nextBlock = null;
    let previousBlock = container.querySelector(`.time-block[data-end="${user.start}"]`);
    if (!areClassesEqual(block, previousBlock))
        previousBlock = null;

    if (nextBlock === null && previousBlock === null) {
        if (!block.classList.contains('disabled'))
        {
            disableIntersectionWithSelected(block);
        }
        return;
    }

    let processBar = block.closest('.user-selector').querySelector('.process-bar');
    let process = {
        id: processBar.closest('tr').dataset.processId,
        start: processBar.dataset.start,
        end: processBar.dataset.end
    }

    if (nextBlock !== null) {
        user.end = nextBlock.dataset.end;
        container.removeChild(nextBlock);
    }
    if (previousBlock !== null) {
        user.start = previousBlock.dataset.start;
        container.removeChild(previousBlock);
    }
    
    let newBlock = createTimeBlock(process, user);
    newBlock.classList = block.classList;
    container.appendChild(newBlock);
    container.removeChild(block);
    
    if (!block.classList.contains('disabled'))
    {
        disableIntersectionWithSelected(newBlock);
    }
}

function disableOverlappingBlocks(timeBlock) {
    let user = {
        id: timeBlock.dataset.userId,
        start: timeBlock.dataset.start,
        end: timeBlock.dataset.end
    }

    let processId = timeBlock.closest('tr').dataset.processId;

    let processBlocks = timeBlock.closest('.user-bars').querySelectorAll(`li:not([data-user-id="${user.id}"])>.time-block:not(.selected):not(.disabled)`);
    processBlocks.forEach(block => {
        disableBlockByUser(block, user);
    });

    outerBlocks = document.querySelectorAll(`tr:not([data-process-id="${processId}"]) li[data-user-id="${user.id}"]>.time-block:not(.selected):not(.disabled)`);
    outerBlocks.forEach(block => {
        disableBlockByUser(block, user);
    });
}

function disableBlockByUser(block, user) {
    let start = block.dataset.start;
    let end = block.dataset.end;
    let id = block.dataset.userId;

    let processBar = block.closest('.user-selector').querySelector('.process-bar');
    let process = {
        id: processBar.closest('tr').dataset.processId,
        start: processBar.dataset.start,
        end: processBar.dataset.end
    }
    
    let container = block.parentElement;

    if (start >= user.end || end <= user.start) return;

    if (user.end > process.end) user.end = process.end;
    if (user.start < process.start) user.start = process.start;

    if (start >= user.start && end <= user.end) {
        block.classList.add('disabled');
        connectAdjacentBlocks(block);
        return;
    }
    
    if (start >= user.start && end > user.end) {
        let disabledBlock = createTimeBlock(process, {id: id, start: start, end: user.end});
        disabledBlock.classList.add('disabled');

        container.appendChild(disabledBlock);
        container.appendChild(createTimeBlock(process, {id: id, start: user.end, end: end}));

        connectAdjacentBlocks(disabledBlock);

    } else if (start < user.start && end <= user.end) {
        let disabledBlock = createTimeBlock(process, {id: id, start: user.start, end: end});
        disabledBlock.classList.add('disabled');

        container.appendChild(disabledBlock);
        container.appendChild(createTimeBlock(process, {id: id, start: start, end: user.start}));

        connectAdjacentBlocks(disabledBlock);
        
    } else {
        let disabledBlock = createTimeBlock(process, {id: id, start: user.start, end: user.end});
        disabledBlock.classList.add('disabled');

        container.appendChild(disabledBlock);
        container.appendChild(createTimeBlock(process, {id: id, start: start, end: user.start}));
        container.appendChild(createTimeBlock(process, {id: id, start: user.end, end: end}));
    }

    container.removeChild(block);
}

function renderUsers(process, users) {
    let userBarsContainer = document.querySelector(`tr[data-process-id="${process.id}"] .user-bars`);
    users.forEach(user => {
        let userBar = userBarsContainer.querySelector(`.user-bar[data-user-id="${user.id}"]`);
        if (userBar === null) {
            let userName = document.createElement('p');
            userName.innerText = user.name;

            userBar = document.createElement('li');
            userBar.dataset.userId = user.id;
            userBar.className = 'user-bar';

            userBarsContainer.appendChild(userName);
            userBarsContainer.appendChild(userBar);
        }
        userBar.appendChild(createTimeBlock(process, user));
    });
}

function submitSelection() {
    const selectedBlocks = document.querySelectorAll('.time-block.selected');
    if (selectedBlocks.length > 0) {
        alert('Process will be executed continuously with the selected users!');
    } else {
        alert('Please select users to cover the process continuously.');
    }
}

function areClassesEqual(element1, element2) {
    if (!element1 || !element2) {
        return false;
    }
    
    const classes1 = Array.from(element1.classList).sort().join(' ');
    const classes2 = Array.from(element2.classList).sort().join(' ');

    return classes1 === classes2;
}

renderUsers(_process, _users);
renderUsers(_process2, _users2);
