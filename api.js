const isLoginPage = window.location.pathname.includes('login.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/');
const isReceiptPage = window.location.pathname.includes('reciept.html');

if (isLoginPage) {
    document.addEventListener('DOMContentLoaded', function() {
        const loginForm = document.getElementById('loginForm');
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        const loginBtn = document.getElementById('loginBtn');
        const loadingState = document.getElementById('loadingState');
        const messageBox = document.getElementById('messageBox');

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
                window.location.href = 'reciept.html';
            } catch (error) {
                hideLoading();
                showMessage(error.message, 'error');
            }
        });

        usernameInput.addEventListener('input', hideMessage);
        passwordInput.addEventListener('input', hideMessage);
    });
}

if (isReceiptPage) {
    document.addEventListener('DOMContentLoaded', function() {
        const welcomeUser = document.getElementById('welcomeUser');
        const logoutBtn = document.getElementById('logoutBtn');
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

        let allRecipes = [];
        let filteredRecipes = [];
        let displayedCount = 6;
        let searchTimeout;

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

            const stars = '⭐'.repeat(Math.round(recipe.rating));

            const ingredientsList = recipe.ingredients.slice(0, 3).join(', ') + 
                (recipe.ingredients.length > 3 ? '...' : '');

            card.innerHTML = `
                <img src="${recipe.image}" alt="${recipe.name}" class="recipe-image" onerror="this.src='https://via.placeholder.com/280x200?text=No+Image'">
                <div class="recipe-content">
                    <h3 class="recipe-title">${recipe.name}</h3>
                    <div class="recipe-meta">
                        <span>⏱️ ${recipe.prepTimeMinutes} mins</span>
                        <span>🔥 ${recipe.difficulty}</span>
                        <span>🌍 ${recipe.cuisine}</span>
                    </div>
                    <div class="recipe-rating">
                        <span class="stars">${stars}</span>
                        <span>(${recipe.rating})</span>
                    </div>
                    <div class="recipe-tags">
                        ${recipe.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                    <div class="recipe-ingredients">
                        <h4>Ingredients</h4>
                        <div class="ingredients-list">${ingredientsList}</div>
                    </div>
                    <button class="btn-view-recipe" data-id="${recipe.id}">VIEW FULL RECIPE</button>
                </div>
            `;

            card.querySelector('.btn-view-recipe').addEventListener('click', () => {
                showRecipeDetail(recipe);
            });

            return card;
        }

        function showRecipeDetail(recipe) {
            const stars = '⭐'.repeat(Math.round(recipe.rating));
            
            const modalBody = document.getElementById('modalBody');
            modalBody.innerHTML = `
                <img src="${recipe.image}" alt="${recipe.name}" class="modal-recipe-image" onerror="this.src='https://via.placeholder.com/800x350?text=No+Image'">
                <h2 class="modal-recipe-title">${recipe.name}</h2>
                <div class="modal-recipe-meta">
                    <span>⏱️ Prep: ${recipe.prepTimeMinutes} mins</span>
                    <span>🍳 Cook: ${recipe.cookTimeMinutes} mins</span>
                    <span>🍽️ Servings: ${recipe.servings}</span>
                    <span>🔥 Difficulty: ${recipe.difficulty}</span>
                    <span>🌍 Cuisine: ${recipe.cuisine}</span>
                    <span>⭐ Rating: ${recipe.rating}</span>
                    <span>📊 Calories: ${recipe.caloriesPerServing}/serving</span>
                </div>
                <div class="recipe-tags">
                    ${recipe.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
                <div class="modal-section">
                    <h3>Ingredients</h3>
                    <ul>
                        ${recipe.ingredients.map(ing => `<li>${ing}</li>`).join('')}
                    </ul>
                </div>
                <div class="modal-section">
                    <h3>Instructions</h3>
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