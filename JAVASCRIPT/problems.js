document.addEventListener('DOMContentLoaded', async () => {
    const problemsGrid = document.getElementById('problemsGrid');
    
    try {
        const response = await fetch('http://localhost:3000/api/problems');
        const { data: problems } = await response.json();
        
        problems.forEach(problem => {
            const card = document.createElement('div');
            card.className = `problem-card ${problem.teams_assigned >= 3 ? 'full' : ''}`;
            card.innerHTML = `
                <h3>${problem.title}</h3>
                <p>${problem.description}</p>
                <p class="teams-info">Teams assigned: ${problem.teams_assigned}/3</p>
            `;
            problemsGrid.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading problems:', error);
        problemsGrid.innerHTML = '<p class="error">Error loading problem statements. Please try again later.</p>';
    }
}); 