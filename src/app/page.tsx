"use client";
import { useState, useEffect } from "react";
import { foodGlossary } from "./glossary";

export default function RecipeApp() {
  const [query, setQuery] = useState("");
  const [recipes, setRecipes] = useState<any[]>([]);
  const [selectedMeal, setSelectedMeal] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // 1. Сөздікті қолданудың күшейтілген функциясы
  const applyGlossary = (text: string) => {
    if (!text) return text;
    let processedText = text;
    
    // Сөздіктегі барлық кілттерді аралап шығып, мәтін ішінен ауыстырамыз
    // Ең ұзын тіркестерден бастап ауыстыру маңызды (мысалы: "garlic cloves" бірінші, сосын "cloves")
    const sortedKeys = Object.keys(foodGlossary).sort((a, b) => b.length - a.length);
    
    sortedKeys.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      if (processedText.toLowerCase().includes(word)) {
        processedText = processedText.replace(regex, foodGlossary[word]);
      }
    });
    return processedText;
  };

  const translateWithGlossary = async (text: string, sl = "en", tl = "kk") => {
    if (!text || text.trim() === "") return text;

    // Алдымен сөздіктен толық сәйкестікті іздеу
    const lowerText = text.toLowerCase().trim();
    if (foodGlossary[lowerText]) return foodGlossary[lowerText];

    const cacheKey = `trans_${sl}_${tl}_${text}`;
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(cacheKey);
      if (saved) return saved;
    }

    try {
      const res = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&q=${encodeURIComponent(text)}`
      );
      const data = await res.json();
      let translated = data[0].map((item: any) => item[0]).join("");

      // Аудармадан кейін СӨЗДІКТІ ҚОЛДАНУ (пост-өңдеу)
      translated = applyGlossary(translated);

      if (typeof window !== "undefined") {
        localStorage.setItem(cacheKey, translated);
      }
      return translated;
    } catch (error) {
      return text;
    }
  };

  const translateMeals = async (meals: any[]) => {
    if (!meals) return [];
    return await Promise.all(
      meals.map(async (meal) => {
        const translatedName = await translateWithGlossary(meal.strMeal);
        const translatedArea = await translateWithGlossary(meal.strArea);
        return { ...meal, strMealKaz: translatedName, strAreaKaz: translatedArea };
      })
    );
  };

  useEffect(() => {
    const loadInitial = async () => {
      setLoading(true);
      const res = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=a`);
      const data = await res.json();
      const translated = await translateMeals(data.meals);
      setRecipes(translated);
      setLoading(false);
    };
    loadInitial();
  }, []);

  const searchRecipes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    setLoading(true);
    const enQuery = await translateWithGlossary(query, "kk", "en");
    const res = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${enQuery}`);
    const data = await res.json();
    const translated = await translateMeals(data.meals);
    setRecipes(translated);
    setLoading(false);
  };

  const openRecipe = async (meal: any) => {
    setLoading(true);
    
    const rawIngredients = [];
    for (let i = 1; i <= 20; i++) {
      const ing = meal[`strIngredient${i}`];
      const measure = meal[`strMeasure${i}`];
      if (ing && ing.trim() !== "") {
        // Әр ингредиент пен мөлшерді жеке-жеке сөздікпен өңдейміз
        rawIngredients.push({
          origIng: ing,
          origMeasure: measure
        });
      }
    }

    // Нұсқаулық пен категорияны аудару
    const [translatedInstructions, translatedCategory] = await Promise.all([
      translateWithGlossary(meal.strInstructions),
      translateWithGlossary(meal.strCategory)
    ]);


    const formattedInstructions = translatedInstructions
      .replace(/қадам\s*(\d+)/gi, "$1-ші қадам")
      .replace(/Step\s*(\d+)/gi, "$1-ші қадам");

    // Ингредиенттерді аудару және сөздікпен күшейту
    const ingredientsKaz = await Promise.all(rawIngredients.map(async (item) => {
      const transIng = await translateWithGlossary(item.origIng);
      const transMeasure = await translateWithGlossary(item.origMeasure);
      
      return {
        ing: applyGlossary(transIng), // Тікелей сөздікті қолдану
        measure: applyGlossary(transMeasure) // Өлшем бірлігін ауыстыру
      };
    }));

    setSelectedMeal({
      ...meal,
      strMealKaz: await translateWithGlossary(meal.strMeal),
      strAreaKaz: await translateWithGlossary(meal.strArea),
      strInstructionsKaz: formattedInstructions,
      strCategoryKaz: translatedCategory,
      ingredientsKaz: ingredientsKaz
    });
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-[#fffcf7] p-4 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-10">
          <h1 className="text-6xl font-black text-[#e67e22] mb-2 tracking-tighter">Damdy Tagam</h1>

        </header>

        <form onSubmit={searchRecipes} className="flex gap-3 max-w-2xl mx-auto mb-16">
          <input
            type="text"
            placeholder="Тағам атын қазақша жазыңыз..."
            className="flex-1 p-5 rounded-3xl border-2 text-black border-orange-100 focus:border-orange-500 outline-none shadow-lg transition-all"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className="bg-orange-500 text-white px-10 rounded-3xl font-bold hover:bg-orange-600 transition-all shadow-md">
            Іздеу
          </button>
        </form>

        {loading && (
          <div className="text-center py-10 flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-orange-500"></div>
            <p className="font-bold text-orange-500 italic">Әзірлеп жатырмын...</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {recipes.map((meal: any) => (
            <div 
              key={meal.idMeal} 
              onClick={() => openRecipe(meal)} 
              className="bg-white rounded-[2.5rem] overflow-hidden shadow-xl hover:scale-105 transition-all cursor-pointer border border-orange-50"
            >
              <img src={meal.strMealThumb} className="w-full h-60 object-cover" alt="" />
              <div className="p-6">
                <h3 className="text-xl font-extrabold text-gray-800">{meal.strMealKaz || meal.strMeal}</h3>
                <p className="text-orange-500 font-bold text-sm mt-1 uppercase tracking-wider italic">
                  {meal.strAreaKaz || meal.strArea}
                </p>
              </div>
            </div>
          ))}
        </div>

        {selectedMeal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-[3rem] max-w-4xl w-full p-8 md:p-12 relative shadow-2xl overflow-y-auto max-h-[90vh]">
              <button 
                onClick={() => setSelectedMeal(null)} 
                className="absolute top-8 right-10 text-3xl font-light hover:text-orange-500 transition-colors"
              >✕</button>
              
              <div className="grid md:grid-cols-2 gap-10 border-b border-gray-100 pb-10">
                <img src={selectedMeal.strMealThumb} className="w-full h-[350px] object-cover rounded-[2rem] shadow-lg" alt="" />
                <div>
                  <h2 className="text-4xl font-black text-gray-900 mb-2 leading-tight">{selectedMeal.strMealKaz}</h2>
                  <div className="flex flex-wrap gap-2 mb-6 text-xs font-bold uppercase">
                    <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full">САНАТ: {selectedMeal.strCategoryKaz}</span>
                    <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full">АСХАНА: {selectedMeal.strAreaKaz}</span>
                  </div>
                  
                  <h4 className="font-bold text-xl mb-4 border-l-4 border-orange-500 pl-3 text-gray-800 uppercase tracking-tighter">Ингредиенттер:</h4>
                  <ul className="text-md space-y-2 h-52 overflow-y-auto pr-4 custom-scrollbar bg-gray-50 p-4 rounded-2xl shadow-inner">
                    {selectedMeal.ingredientsKaz?.map((item: any, i: number) => (
                      <li key={i} className="flex justify-between border-b border-gray-200 py-2">
                        <span className="text-gray-900 font-semibold">• {item.ing}</span>
                        <span className="text-orange-600 font-bold italic text-sm">{item.measure}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-10">
                <h4 className="font-bold text-2xl text-orange-600 mb-6 italic flex items-center gap-2">
                   <span>👨‍🍳</span> Дайындалу жолы:
                </h4>
                <div className="text-gray-800 leading-relaxed text-lg bg-[#fff9f0] p-8 rounded-[2rem] border-2 border-orange-50 italic whitespace-pre-line shadow-sm">
                  {selectedMeal.strInstructionsKaz}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}