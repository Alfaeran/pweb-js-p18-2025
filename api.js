const isLoginPage = window.location.pathname.includes('login.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/');
const isReceiptPage = window.location.pathname.includes('reciept.html');

if (isLoginPage) {
    document.addEventListener('DOMContentLoaded', function() {
        const loginForm = document.getElementById('loginForm');
        const themeToggleBtn = document.getElementById('themeToggle');
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        const loginBtn = document.getElementById('loginBtn');
        const loadingState = document.getElementById('loadingState');
        const messageBox = document.getElementById('messageBox');
        const rememberCheckbox = document.getElementById('rememberMe');
        const forgotLink = document.getElementById('forgotLink');
        const forgotModal = document.getElementById('forgotModal');
        const forgotClose = document.getElementById('forgotClose');
        const sendResetBtn = document.getElementById('sendResetBtn');
        const forgotEmail = document.getElementById('forgotEmail');
        const forgotMessage = document.getElementById('forgotMessage');

        function showMessage(message, type) {
            messageBox.textContent = message;
            messageBox.className = `message-box ${type}`;
            messageBox.style.display = 'block';
        }

        function hideMessage() {
            messageBox.style.display = 'none';
        }

        function showLoading() {
            loadingState.style.display = 'block';
            loginBtn.disabled = true;
            hideMessage();
        }

        function hideLoading() {
            loadingState.style.display = 'none';
            loginBtn.disabled = false;
        }

        async function getAllUsers() {
            try {
                const response = await fetch('https://dummyjson.com/users');
                if (!response.ok) {
                    throw new Error('Failed to fetch users data');
                }
                const data = await response.json();
                return data.users;
            } catch (error) {
                throw new Error('API connection problem: ' + error.message);
            }
        }

        async function validateLogin(username, password) {
            if (!password || password.trim() === '') {
                throw new Error('Password cannot be empty');
            }
            const users = await getAllUsers();
            const user = users.find(u => u.username === username);
            if (!user) {
                throw new Error('Username not found');
            }
            return user;
        }

        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const username = usernameInput.value.trim();
            const password = passwordInput.value;

            if (!username) {
                showMessage('Username cannot be empty', 'error');
                return;
            }
            if (!password) {
                showMessage('Password cannot be empty', 'error');
                return;
            }

            showLoading();

            try {
                const user = await validateLogin(username, password);
                showMessage('Login successful! Redirecting...', 'success');
                localStorage.setItem('firstName', user.firstName);
                localStorage.setItem('userId', user.id);
                localStorage.setItem('isLoggedIn', 'true');
                if (rememberCheckbox && rememberCheckbox.checked) {
                    localStorage.setItem('rememberUsername', username);
                } else {
                    localStorage.removeItem('rememberUsername');
                }
                window.location.href = 'reciept.html';
            } catch (error) {
                hideLoading();
                showMessage(error.message, 'error');
            }
        });

        usernameInput.addEventListener('input', hideMessage);
        passwordInput.addEventListener('input', hideMessage);

        const remembered = localStorage.getItem('rememberUsername');
        if (remembered) {
            usernameInput.value = remembered;
            if (rememberCheckbox) rememberCheckbox.checked = true;
        }

        function openForgot() {
            if (!forgotModal) return;
            forgotModal.setAttribute('aria-hidden', 'false');
            forgotModal.style.display = 'flex';
            forgotEmail.focus();
        }
        
        function closeForgot() {
            if (!forgotModal) return;
            forgotModal.setAttribute('aria-hidden', 'true');
            forgotModal.style.display = 'none';
            forgotMessage.style.display = 'none';
            forgotMessage.textContent = '';
            forgotEmail.value = '';
        }
        
        if (forgotLink) {
            forgotLink.addEventListener('click', function(e) {
                e.preventDefault();
                openForgot();
            });
        }
        
        if (forgotClose) forgotClose.addEventListener('click', closeForgot);

        if (forgotModal) {
            forgotModal.addEventListener('click', function(e) {
                if (e.target === forgotModal) closeForgot();
            });
        }
        
        if (sendResetBtn) {
            sendResetBtn.addEventListener('click', function() {
                const email = forgotEmail.value.trim();
                if (!email) {
                    forgotMessage.style.display = 'block';
                    forgotMessage.textContent = 'Please enter a valid email address';
                    forgotMessage.className = 'message-box error';
                    return;
                }
                
                forgotMessage.style.display = 'block';
                forgotMessage.textContent = 'If this email exists in our system, a reset link was sent (demo).';
                forgotMessage.className = 'message-box success';
                setTimeout(closeForgot, 2200);
            });
        }

        function initThemeLogin() {
            const savedTheme = localStorage.getItem('theme') || 'light';
            if (savedTheme === 'dark') {
                document.body.classList.add('dark-mode');
                if (themeToggleBtn) themeToggleBtn.innerHTML = '<i class="fi fi-sr-sun"></i>';
            } else {
                document.body.classList.remove('dark-mode');
                if (themeToggleBtn) themeToggleBtn.innerHTML = '<i class="fi fi-rr-moon"></i>';
            }
        }
        
        function toggleThemeLogin() {
            document.body.classList.toggle('dark-mode');
            const isDark = document.body.classList.contains('dark-mode');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            if (themeToggleBtn) themeToggleBtn.innerHTML = isDark ? '<i class="fi fi-sr-sun"></i>' : '<i class="fi fi-rr-moon"></i>';
        }
        
        if (themeToggleBtn) themeToggleBtn.addEventListener('click', toggleThemeLogin);
        initThemeLogin();
    });
}

if (isReceiptPage) {
    document.addEventListener('DOMContentLoaded', function() {
        const welcomeUser = document.getElementById('welcomeUser');
        const logoutBtn = document.getElementById('logoutBtn');
        const themeToggle = document.getElementById('themeToggle');
        const searchInput = document.getElementById('searchInput');
        const cuisineFilter = document.getElementById('cuisineFilter');
        const recipesGrid = document.getElementById('recipesGrid');
        const loadingContainer = document.getElementById('loadingContainer');
        const errorContainer = document.getElementById('errorContainer');
        const resultsCount = document.getElementById('resultsCount');
        const showMoreContainer = document.getElementById('showMoreContainer');
        const showMoreBtn = document.getElementById('showMoreBtn');
        const recipeModal = document.getElementById('recipeModal');
        const closeModal = document.querySelector('.close');

        // Check if themeToggle button exists
        if (!themeToggle) {
            console.error('Theme toggle button not found!');
            return;
        }
        console.log('Theme toggle button found:', themeToggle);

        let allRecipes = [];
        let filteredRecipes = [];
        let displayedCount = 6;
        let searchTimeout;

        // Dark mode functionality - simplified and more robust
        function initTheme() {
            const savedTheme = localStorage.getItem('theme') || 'light';
            console.log('Initializing theme:', savedTheme);
            
            const body = document.body;
            const toggle = document.getElementById('themeToggle');
            
            if (savedTheme === 'dark') {
                body.classList.add('dark-mode');
                if (toggle) toggle.innerHTML = '<i class="fi fi-sr-sun"></i>';
            } else {
                body.classList.remove('dark-mode');
                if (toggle) toggle.innerHTML = '<i class="fi fi-rr-moon"></i>';
            }
            
            console.log('Body classes after init:', body.className);
        }

        function toggleTheme() {
            console.log('Theme toggle function called');
            const body = document.body;
            const toggle = document.getElementById('themeToggle');
            
            body.classList.toggle('dark-mode');
            const isDark = body.classList.contains('dark-mode');
            console.log('Is dark mode:', isDark);
            
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            if (toggle) {
                toggle.innerHTML = isDark ? '<i class="fi fi-sr-sun"></i>' : '<i class="fi fi-rr-moon"></i>';
            }
            console.log('Theme saved to localStorage:', localStorage.getItem('theme'));
            
            // Update debug info
            updateDebugInfo();
        }

        function updateDebugInfo() {
            const debugInfo = document.getElementById('debugInfo');
            const currentTheme = document.getElementById('currentTheme');
            const bodyClasses = document.getElementById('bodyClasses');
            
            if (currentTheme) currentTheme.textContent = localStorage.getItem('theme') || 'light';
            if (bodyClasses) bodyClasses.textContent = document.body.className || 'none';
        }

        // Make functions globally accessible for debugging
        window.toggleTheme = toggleTheme;
        window.updateDebugInfo = updateDebugInfo;

        // Add event listener to theme toggle
        if (themeToggle) {
            themeToggle.addEventListener('click', toggleTheme);
            console.log('Event listener added to theme toggle');
        } else {
            console.error('Theme toggle button not found!');
        }

        initTheme();
        
        // Show debug info initially
        const debugInfo = document.getElementById('debugInfo');
        if (debugInfo) {
            debugInfo.style.display = 'block';
            updateDebugInfo();
        }

        // Also add a backup event listener using direct element access
        document.addEventListener('click', function(e) {
            if (e.target.closest('#themeToggle')) {
                console.log('Backup theme toggle clicked');
                toggleTheme();
            }
        });

        // Add keyboard shortcut for testing (Ctrl+D)
        document.addEventListener('keydown', function(e) {
            if (e.ctrlKey && e.key === 'd') {
                e.preventDefault();
                console.log('Keyboard shortcut triggered');
                toggleTheme();
            }
        });

        function checkAuth() {
            const isLoggedIn = localStorage.getItem('isLoggedIn');
            const firstName = localStorage.getItem('firstName');
            if (!isLoggedIn || !firstName) {
                window.location.href = 'login.html';
                return false;
            }
            welcomeUser.textContent = `Welcome, ${firstName}!`;
            return true;
        }

        async function fetchRecipes() {
            try {
                loadingContainer.style.display = 'block';
                errorContainer.style.display = 'none';
                recipesGrid.innerHTML = '';

                const response = await fetch('https://dummyjson.com/recipes');
                if (!response.ok) {
                    throw new Error('Failed to fetch recipes');
                }

                const data = await response.json();
                allRecipes = data.recipes;
                filteredRecipes = allRecipes;
                
                populateCuisineFilter();
                displayRecipes();
            } catch (error) {
                showError('Error loading recipes: ' + error.message);
            } finally {
                loadingContainer.style.display = 'none';
            }
        }

        function showError(message) {
            errorContainer.textContent = message;
            errorContainer.style.display = 'block';
            recipesGrid.innerHTML = '';
            showMoreContainer.style.display = 'none';
        }

        function populateCuisineFilter() {
            const cuisines = [...new Set(allRecipes.map(r => r.cuisine))].sort();
            cuisineFilter.innerHTML = '<option value="">All Cuisines</option>';
            cuisines.forEach(cuisine => {
                const option = document.createElement('option');
                option.value = cuisine;
                option.textContent = cuisine;
                cuisineFilter.appendChild(option);
            });
        }

        function filterRecipes() {
            const searchTerm = searchInput.value.toLowerCase();
            const selectedCuisine = cuisineFilter.value;

            filteredRecipes = allRecipes.filter(recipe => {
                const matchesSearch = !searchTerm || 
                    recipe.name.toLowerCase().includes(searchTerm) ||
                    recipe.cuisine.toLowerCase().includes(searchTerm) ||
                    recipe.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
                    recipe.ingredients.some(ing => ing.toLowerCase().includes(searchTerm));

                const matchesCuisine = !selectedCuisine || recipe.cuisine === selectedCuisine;

                return matchesSearch && matchesCuisine;
            });

            displayedCount = 6;
            displayRecipes();
        }

        function displayRecipes() {
            recipesGrid.innerHTML = '';
            const recipesToShow = filteredRecipes.slice(0, displayedCount);

            if (filteredRecipes.length === 0) {
                recipesGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 40px; color: #666;">No recipes found</p>';
                showMoreContainer.style.display = 'none';
                resultsCount.textContent = 'Showing 0 recipes';
                return;
            }

            recipesToShow.forEach(recipe => {
                const card = createRecipeCard(recipe);
                recipesGrid.appendChild(card);
            });

            resultsCount.textContent = `Showing ${recipesToShow.length} of ${filteredRecipes.length} recipes`;

            if (displayedCount < filteredRecipes.length) {
                showMoreContainer.style.display = 'block';
            } else {
                showMoreContainer.style.display = 'none';
            }
        }

        function createRecipeCard(recipe) {
            const card = document.createElement('div');
            card.className = 'recipe-card';

            // Generate star rating using Flaticon icons
            const fullStars = Math.floor(recipe.rating);
            const hasHalfStar = recipe.rating % 1 >= 0.5;
            const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
            
            let starsHtml = '';
            for (let i = 0; i < fullStars; i++) {
                starsHtml += '<i class="fi fi-sr-star star-filled"></i>';
            }
            if (hasHalfStar) {
                starsHtml += '<i class="fi fi-rr-star-half-stroke star-half"></i>';
            }
            for (let i = 0; i < emptyStars; i++) {
                starsHtml += '<i class="fi fi-rr-star star-empty"></i>';
            }

            const ingredientsList = recipe.ingredients.slice(0, 3).join(', ') + 
                (recipe.ingredients.length > 3 ? '...' : '');

            card.innerHTML = `
                <img src="${recipe.image}" alt="${recipe.name}" class="recipe-image" onerror="this.src='https://via.placeholder.com/280x200?text=No+Image'">
                <div class="recipe-content">
                    <h3 class="recipe-title">
                        <i class="fi fi-rr-utensils"></i>
                        ${recipe.name}
                    </h3>
                    <div class="recipe-meta">
                        <span><i class="fi fi-rr-clock"></i> ${recipe.prepTimeMinutes} mins</span>
                        <span><i class="fi fi-rr-flame"></i> ${recipe.difficulty}</span>
                        <span><i class="fi fi-rr-world"></i> ${recipe.cuisine}</span>
                    </div>
                    <div class="recipe-rating">
                        <span class="stars-container">${starsHtml}</span>
                        <span class="rating-text">(${recipe.rating})</span>
                    </div>
                    <div class="recipe-tags">
                        ${recipe.tags.map(tag => `<span class="tag"><i class="fi fi-rr-hashtag"></i>${tag}</span>`).join('')}
                    </div>
                    <div class="recipe-ingredients">
                        <h4><i class="fi fi-rr-list-check"></i> Ingredients</h4>
                        <div class="ingredients-list">${ingredientsList}</div>
                    </div>
                    <button class="btn-view-recipe" data-id="${recipe.id}">
                        <i class="fi fi-rr-eye"></i>
                        VIEW FULL RECIPE
                    </button>
                </div>
            `;

            card.querySelector('.btn-view-recipe').addEventListener('click', () => {
                showRecipeDetail(recipe);
            });

            return card;
        }

        function showRecipeDetail(recipe) {
            // Generate star rating using Flaticon icons
            const fullStars = Math.floor(recipe.rating);
            const hasHalfStar = recipe.rating % 1 >= 0.5;
            const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
            
            let starsHtml = '';
            for (let i = 0; i < fullStars; i++) {
                starsHtml += '<i class="fi fi-sr-star star-filled"></i>';
            }
            if (hasHalfStar) {
                starsHtml += '<i class="fi fi-rr-star-half-stroke star-half"></i>';
            }
            for (let i = 0; i < emptyStars; i++) {
                starsHtml += '<i class="fi fi-rr-star star-empty"></i>';
            }
            
            const modalBody = document.getElementById('modalBody');
            modalBody.innerHTML = `
                <img src="${recipe.image}" alt="${recipe.name}" class="modal-recipe-image" onerror="this.src='https://via.placeholder.com/800x350?text=No+Image'">
                <h2 class="modal-recipe-title">
                    <i class="fi fi-rr-chef-hat"></i>
                    ${recipe.name}
                </h2>
                <div class="modal-recipe-meta">
                    <span><i class="fi fi-rr-clock"></i> Prep: ${recipe.prepTimeMinutes} mins</span>
                    <span><i class="fi fi-rr-pot"></i> Cook: ${recipe.cookTimeMinutes} mins</span>
                    <span><i class="fi fi-rr-users"></i> Servings: ${recipe.servings}</span>
                    <span><i class="fi fi-rr-flame"></i> Difficulty: ${recipe.difficulty}</span>
                    <span><i class="fi fi-rr-world"></i> Cuisine: ${recipe.cuisine}</span>
                    <span><i class="fi fi-rr-star"></i> Rating: <span class="stars-container">${starsHtml}</span> (${recipe.rating})</span>
                    <span><i class="fi fi-rr-chart-histogram"></i> Calories: ${recipe.caloriesPerServing}/serving</span>
                </div>
                <div class="recipe-tags">
                    ${recipe.tags.map(tag => `<span class="tag"><i class="fi fi-rr-hashtag"></i>${tag}</span>`).join('')}
                </div>
                <div class="modal-section">
                    <h3><i class="fi fi-rr-shopping-cart"></i> Ingredients</h3>
                    <ul>
                        ${recipe.ingredients.map(ing => `<li><i class="fi fi-rr-check"></i>${ing}</li>`).join('')}
                    </ul>
                </div>
                <div class="modal-section">
                    <h3><i class="fi fi-rr-list"></i> Instructions</h3>
                    <ol>
                        ${recipe.instructions.map(inst => `<li>${inst}</li>`).join('')}
                    </ol>
                </div>
            `;

            recipeModal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        }

        function closeModalFunc() {
            recipeModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }

        closeModal.onclick = closeModalFunc;

        window.onclick = function(event) {
            if (event.target === recipeModal) {
                closeModalFunc();
            }
        };

        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                filterRecipes();
            }, 500);
        });

        cuisineFilter.addEventListener('change', filterRecipes);

        showMoreBtn.addEventListener('click', function() {
            displayedCount += 6;
            displayRecipes();
        });

        logoutBtn.addEventListener('click', function() {
            localStorage.removeItem('firstName');
            localStorage.removeItem('userId');
            localStorage.removeItem('isLoggedIn');
            window.location.href = 'login.html';
        });

        if (checkAuth()) {
            fetchRecipes();
        }
    });
}
