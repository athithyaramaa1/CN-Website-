document.addEventListener('DOMContentLoaded', async () => {
    const teamMembersDiv = document.getElementById('teamMembers');
    const problemSelect = document.getElementById('problemStatement');
    const problemDescription = document.getElementById('problemDescription');
    const problemAvailability = document.getElementById('problemAvailability');
    
    // Add 3 team member sections
    for (let i = 1; i <= 3; i++) {
        addTeamMemberSection(i);
    }

    // Check registration availability
    try {
        const response = await fetch('https://cybernerds.vercel.app/api/registration-status');
        const data = await response.json();
        
        if (!data.isOpen) {
            alert('Registration is closed. Maximum number of teams reached.');
            window.location.href = '/game-hacking';
            return;
        }
    } catch (error) {
        console.error('Error checking registration status:', error);
    }

    // Load problem statements
    try {
        const response = await fetch('https://cybernerds.vercel.app/api/problems');
        const { data: problems } = await response.json();
        
        problems.forEach(problem => {
            const option = document.createElement('option');
            option.value = problem.id;
            option.textContent = problem.title;
            option.dataset.description = problem.description;
            option.dataset.teamsAssigned = problem.teams_assigned;
            problemSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading problem statements:', error);
    }

    // Handle problem statement selection
    problemSelect.addEventListener('change', () => {
        const selectedOption = problemSelect.selectedOptions[0];
        if (selectedOption.value) {
            const teamsAssigned = parseInt(selectedOption.dataset.teamsAssigned);
            problemDescription.innerHTML = `
                <p class="problem-description-text">${selectedOption.dataset.description}</p>
                <p class="teams-assigned">Teams assigned: ${teamsAssigned}/3</p>
            `;
            
            if (teamsAssigned >= 3) {
                problemAvailability.textContent = 'This problem statement is no longer available';
                problemAvailability.classList.add('unavailable');
                problemSelect.value = '';
            } else {
                problemAvailability.textContent = `${3 - teamsAssigned} slots remaining`;
                problemAvailability.classList.remove('unavailable');
            }
        } else {
            problemDescription.innerHTML = '';
            problemAvailability.textContent = '';
        }
    });

    document.getElementById('registrationForm').addEventListener('submit', handleSubmit);
});

function addTeamMemberSection(memberNum) {
    const section = document.createElement('div');
    section.className = 'team-section';
    section.innerHTML = `
        <h3>Team Member ${memberNum}</h3>
        <div class="form-group">
            <input type="text" id="member${memberNum}Name" name="member${memberNum}Name" required>
            <label>Full Name</label>
        </div>
        <div class="form-group">
            <input type="text" id="member${memberNum}RegNo" name="member${memberNum}RegNo" required>
            <label>Registration Number</label>
        </div>
        <div class="form-group">
            <select id="member${memberNum}Department" name="member${memberNum}Department" required>
                <option value="">Select Department</option>
                <option value="CSE">CSE</option>
                <option value="IT">IT</option>
                <option value="CS/IT">CS/IT</option>
            </select>
        </div>
        <div class="form-group">
            <select id="member${memberNum}Year" name="member${memberNum}Year" required>
                <option value="">Select Year</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
            </select>
        </div>
        <div class="form-group">
            <input type="tel" id="member${memberNum}Phone" name="member${memberNum}Phone" pattern="[0-9]{10}" required>
            <label>Phone Number</label>
        </div>
    `;
    document.getElementById('teamMembers').appendChild(section);
}

async function handleSubmit(e) {
    e.preventDefault();
    
    const problemStatementId = document.getElementById('problemStatement').value;
    if (!problemStatementId) {
        alert('Please select a problem statement');
        return;
    }

    const formData = {
        leader: {
            name: document.getElementById('leaderName').value,
            regNo: document.getElementById('leaderRegNo').value,
            department: document.getElementById('leaderDepartment').value,
            year: document.getElementById('leaderYear').value,
            phone: document.getElementById('leaderPhone').value
        },
        members: []
    };

    // Collect member data
    for (let i = 1; i <= 3; i++) {
        formData.members.push({
            name: document.getElementById(`member${i}Name`).value,
            regNo: document.getElementById(`member${i}RegNo`).value,
            department: document.getElementById(`member${i}Department`).value,
            year: document.getElementById(`member${i}Year`).value,
            phone: document.getElementById(`member${i}Phone`).value
        });
    }

    try {
        const response = await fetch('https://cybernerds.vercel.app/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                teamData: formData,
                problemStatementId 
            })
        });

        const data = await response.json();
        
        if (data.success) {
            const modal = document.createElement('div');
            modal.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: #1a1a1a;
                padding: 2rem;
                border-radius: 10px;
                border: 2px solid #00ff00;
                box-shadow: 0 0 20px rgba(0, 255, 0, 0.3);
                z-index: 1000;
                text-align: center;
            `;
            modal.innerHTML = `
                <h2 style="color: #00ff00; margin-bottom: 1rem;">Registration Successful!</h2>
                <p style="color: #fff; margin-bottom: 1.5rem;">Your team has been registered successfully.</p>
                <button onclick="this.parentElement.remove()" style="
                    background: #00ff00;
                    color: #000;
                    border: none;
                    padding: 0.5rem 1rem;
                    border-radius: 5px;
                    cursor: pointer;
                ">OK</button>
            `;
            document.body.appendChild(modal);
            window.location.href = '/game-hacking';
        } else {
            alert('Registration failed: ' + data.message);
        }
    } catch (error) {
        alert('Error submitting form: ' + error.message);
    }
} 