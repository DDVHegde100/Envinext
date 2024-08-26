// Initialize user data if not already present
if (!localStorage.getItem('userData')) {
    localStorage.setItem('userData', JSON.stringify({
        points: 0,
        campaignsCompleted: [],
        treesPlanted: 0
    }));
}

// Function to update user stats
function updateStats(points = 0, campaigns = [], trees = 0) {
    let userData = JSON.parse(localStorage.getItem('userData'));
    userData.points += points;
    userData.campaignsCompleted.push(...campaigns);
    userData.treesPlanted += trees;
    localStorage.setItem('userData', JSON.stringify(userData));
}

// Function to retrieve user stats
function getStats() {
    return JSON.parse(localStorage.getItem('userData'));
}
