function selectProtein(protein) {
    try {
      console.log('Protein selected:', protein);
      localStorage.setItem('selectedProtein', protein);
      // عند اختيار بروتين جديد، امسح الوصفات المقترحة المحفوظة
      localStorage.removeItem('suggestedRecipes');
      localStorage.removeItem('previouslySuggested');
      window.location.href = 'recipes.html';
    } catch (error) {
      console.error('Error in selectProtein:', error);
      window.location.href = 'recipes.html';
    }
  }
  
  async function loadRecipes() {
    try {
      console.log('Attempting to load recipes.json');
      const response = await fetch('recipes.json');
      if (!response.ok) {
        throw new Error(`فشل تحميل الوصفات: ${response.status}`);
      }
      const data = await response.json();
      console.log('Recipes loaded:', data.recipes.length, 'recipes');
      return data;
    } catch (error) {
      console.error('خطأ في تحميل الوصفات:', error);
      return { recipes: [] };
    }
  }
  
  // خوارزمية Fisher-Yates Shuffle للترتيب العشوائي
  function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
  
  function getRandomRecipes(recipes, count) {
    // جلب الوصفات المقترحة سابقًا من localStorage
    let previouslySuggested = JSON.parse(localStorage.getItem('previouslySuggested') || '[]');
    console.log('Previously suggested recipe IDs:', previouslySuggested);
  
    // تصفية الوصفات لاستبعاد المقترحة مؤخرًا (إذا أمكن)
    let availableRecipes = recipes.filter(recipe => !previouslySuggested.includes(recipe.id));
    if (availableRecipes.length < count) {
      // إذا نفدت الوصفات غير المقترحة، أعد التهيئة
      console.log('Resetting previously suggested recipes');
      previouslySuggested = [];
      availableRecipes = [...recipes];
    }
  
    // خلط الوصفات المتاحة
    const shuffled = shuffleArray(availableRecipes);
    const selectedRecipes = shuffled.slice(0, Math.min(count, shuffled.length));
  
    // تحديث قائمة الوصفات المقترحة
    const selectedIds = selectedRecipes.map(recipe => recipe.id);
    previouslySuggested = [...previouslySuggested, ...selectedIds].slice(-recipes.length); // الحفاظ على حجم محدود
    localStorage.setItem('previouslySuggested', JSON.stringify(previouslySuggested));
    console.log('New suggested recipe IDs:', selectedIds);
  
    return selectedRecipes;
  }
  
  document.addEventListener('DOMContentLoaded', async () => {
    // الصفحة الثانية (recipes.html)
    if (window.location.pathname.includes('recipes.html')) {
      console.log('recipes.html loaded');
      const protein = localStorage.getItem('selectedProtein');
      console.log('Selected protein:', protein);
      if (!protein) {
        console.warn('No protein selected, redirecting to index.html');
        window.location.href = 'index.html';
        return;
      }
  
      // جلب الوصفات المقترحة المحفوظة من localStorage
      let suggestedRecipes = JSON.parse(localStorage.getItem('suggestedRecipes') || '[]');
      console.log('Stored suggested recipes:', suggestedRecipes);
  
      // تحقق مما إذا كان البروتين الحالي يتطابق مع البروتين المرتبط بالوصفات المحفوظة
      const storedProtein = localStorage.getItem('suggestedProtein');
      let recipesToDisplay;
  
      if (suggestedRecipes.length > 0 && storedProtein === protein) {
        // إذا كان البروتين هو نفسه، استخدم الوصفات المحفوظة
        console.log('Using stored suggested recipes for protein:', protein);
        recipesToDisplay = suggestedRecipes;
      } else {
        // إذا تغير البروتين أو لا توجد وصفات محفوظة، اختر وصفات جديدة
        console.log('Selecting new recipes for protein:', protein);
        const data = await loadRecipes();
        const filteredRecipes = data.recipes.filter(recipe => recipe.protein === protein);
        console.log('Filtered recipes:', filteredRecipes);
  
        if (filteredRecipes.length === 0) {
          console.warn('No recipes found for protein:', protein);
          document.getElementById('recipe-list').innerHTML = '<p>لا توجد وصفات لهذا البروتين.</p>';
          return;
        }
  
        recipesToDisplay = getRandomRecipes(filteredRecipes, 3);
        // احفظ الوصفات المقترحة والبروتين المرتبط
        localStorage.setItem('suggestedRecipes', JSON.stringify(recipesToDisplay));
        localStorage.setItem('suggestedProtein', protein);
      }
  
      const recipeList = document.getElementById('recipe-list');
      recipeList.innerHTML = '';
  
      if (recipesToDisplay.length === 0) {
        console.warn('No recipes to display');
        recipeList.innerHTML = '<p>لا توجد وصفات لهذا البروتين.</p>';
        return;
      }
  
      recipesToDisplay.forEach(recipe => {
        const card = document.createElement('div');
        card.className = 'recipe-card';
        card.innerHTML = `
          <img src="images/${recipe.image || 'default.jpg'}" alt="${recipe.name}">
          <h3>${recipe.name}</h3>
          <button onclick="viewRecipe(${recipe.id})">عرض التفاصيل</button>
        `;
        recipeList.appendChild(card);
      });
    }
  
    // الصفحة الثالثة (recipe-details.html)
    if (window.location.pathname.includes('recipe-details.html')) {
      console.log('recipe-details.html loaded');
      const recipeId = parseInt(localStorage.getItem('selectedRecipeId'));
      console.log('Selected recipe ID:', recipeId);
      if (!recipeId) {
        console.warn('No recipe ID selected, redirecting to recipes.html');
        window.location.href = 'recipes.html';
        return;
      }
  
      const data = await loadRecipes();
      const recipe = data.recipes.find(recipe => {
        console.log('Checking recipe ID:', recipe.id, 'against', recipeId);
        return recipe.id === recipeId;
      });
      console.log('Selected recipe:', recipe);
  
      if (!recipe) {
        console.warn('Recipe not found for ID:', recipeId);
        document.getElementById('recipe-details').innerHTML = '<p>الوصفة غير موجودة.</p>';
        return;
      }
  
      // عرض تفاصيل الوصفة
      console.log('Displaying recipe details:', recipe);
      document.getElementById('recipe-name').textContent = recipe.name || 'غير متوفر';
      document.getElementById('recipe-image').src = `images/${recipe.image || 'default.jpg'}`;
      document.getElementById('recipe-image').alt = recipe.name || 'صورة الوصفة';
      document.getElementById('recipe-protein').textContent = recipe.protein || 'غير متوفر';
      document.getElementById('recipe-prepTime').textContent = recipe.prepTime || 'غير متوفر';
      document.getElementById('recipe-cookTime').textContent = recipe.cookTime || 'غير متوفر';
  
      // عرض المكونات كقائمة
      const ingredientsList = document.getElementById('recipe-ingredients');
      ingredientsList.innerHTML = '';
      if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
        recipe.ingredients.forEach(ingredient => {
          const li = document.createElement('li');
          li.textContent = ingredient;
          ingredientsList.appendChild(li);
        });
      } else {
        ingredientsList.innerHTML = '<li>غير متوفر</li>';
      }
  
      // عرض طريقة التحضير (مع الحفاظ على التنسيق)
      const preparation = document.getElementById('recipe-preparation');
      if (recipe.preparation) {
        preparation.innerHTML = recipe.preparation.replace(/\n/g, '<br>');
      } else {
        preparation.textContent = 'غير متوفر';
      }
    }
  });
  
  function viewRecipe(id) {
    console.log('Viewing recipe ID:', id);
    localStorage.setItem('selectedRecipeId', id);
    window.location.href = 'recipe-details.html';
  }