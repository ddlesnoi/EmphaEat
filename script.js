console.log("Скрипт загружен");

const foodDatabase = {
    "курица": { calories: 165, protein: 31, carbs: 0, fats: 3.6, basePoints: 20, usefulness: "высокая", category: "белки" },
    "рис": { calories: 130, protein: 2.7, carbs: 28, fats: 0.3, basePoints: 10, usefulness: "средняя", category: "углеводы" },
    "чипсы": { calories: 536, protein: 7, carbs: 50, fats: 34, basePoints: 5, usefulness: "низкая", category: "перекусы" },
    "яйца": { calories: 155, protein: 13, carbs: 1.1, fats: 11, basePoints: 15, usefulness: "высокая", category: "белки" },
    "авокадо": { calories: 160, protein: 2, carbs: 9, fats: 15, basePoints: 10, usefulness: "высокая", category: "жиры" },
    "шоколад": { calories: 546, protein: 4.9, carbs: 61.6, fats: 31.3, basePoints: 5, usefulness: "низкая", category: "сладости" },
    "орехи": { calories: 654, protein: 15, carbs: 22, fats: 60, basePoints: 10, usefulness: "средняя", category: "жиры" },
    "паста": { calories: 131, protein: 5.2, carbs: 25.6, fats: 1.1, basePoints: 5, usefulness: "средняя", category: "углеводы" },
    "пицца": { calories: 266, protein: 12.6, carbs: 33.3, fats: 8.5, basePoints: 5, usefulness: "низкая", category: "перекусы" },
    "картофель": { calories: 77, protein: 2, carbs: 17.2, fats: 0.1, basePoints: 10, usefulness: "средняя", category: "углеводы" },
    "сыр": { calories: 404, protein: 23, carbs: 3.1, fats: 33, basePoints: 10, usefulness: "средняя", category: "молочные" }
};

const defaultFood = { calories: 100, protein: 5, carbs: 10, fats: 5, basePoints: 10, usefulness: "средняя", category: "другое" };

let userProfile = null;
let userId = null;
let totalScore = 0;
let dailyMacros = { calories: 0, protein: 0, carbs: 0, fats: 0 };
let dailyGoals = { calories: 0, protein: 0, carbs: 0, fats: 0 };
let userLog = [];
const maxDailyScore = 100;
const portionModifiers = {
    "кусок": 1,
    "пару": 2,
    "горсть": 0.5,
    "большой": 2,
    "маленький": 0.5,
    "полкило": 5
};

function setProfile() {
    const age = parseInt(document.getElementById("age").value);
    const gender = document.getElementById("gender").value.toLowerCase();
    const weight = parseFloat(document.getElementById("weight").value);
    const height = parseFloat(document.getElementById("height").value);
    const activity = parseFloat(document.getElementById("activity").value);

    let bmr;
    if (gender === "м") {
        bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
    } else {
        bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
    }
    const tdee = bmr * activity;

    dailyGoals.calories = tdee;
    dailyGoals.protein = (tdee * 0.2) / 4;
    dailyGoals.carbs = (tdee * 0.5) / 4;
    dailyGoals.fats = (tdee * 0.3) / 9;

    userProfile = { age, gender, weight, height, activity };
    userId = "User" + Date.now();
    document.getElementById("profileForm").style.display = "none";
    document.getElementById("hungerButton").style.display = "block";
    document.getElementById("foodInput").style.display = "block";
    document.getElementById("logButton").style.display = "block";
    document.getElementById("resetButton").style.display = "block";
    document.getElementById("excelButton").style.display = "block";
    updateRecommendation();
}

function logFood() {
    const input = document.getElementById("foodInput").value.toLowerCase();
    console.log("Ввод:", input);
    if (!input) {
        alert("Введите еду!");
        return;
    }

    const words = input.split(" ");
    let foodItem = defaultFood;
    let portion = 1;
    let foundFood = null;

    for (let word of words) {
        if (foodDatabase[word]) {
            foodItem = foodDatabase[word];
            foundFood = word;
        } else if (portionModifiers[word]) {
            portion = portionModifiers[word];
        }
    }

    dailyMacros.calories += foodItem.calories * portion;
    dailyMacros.protein += foodItem.protein * portion;
    dailyMacros.carbs += foodItem.carbs * portion;
    dailyMacros.fats += foodItem.fats * portion;

    const proteinProgress = dailyMacros.protein / dailyGoals.protein;
    const carbsProgress = dailyMacros.carbs / dailyGoals.carbs;
    const fatsProgress = dailyMacros.fats / dailyGoals.fats;

    let balanceFactor = 1;
    if (proteinProgress < 0.2 || proteinProgress > 1) balanceFactor = 0.5;
    if (carbsProgress < 0.2 || carbsProgress > 1) balanceFactor = Math.min(balanceFactor, 0.5);
    if (fatsProgress < 0.2 || fatsProgress > 1) balanceFactor = Math.min(balanceFactor, 0.5);

    let points = Math.round(foodItem.basePoints * balanceFactor * portion);
    totalScore += points;
    if (totalScore > maxDailyScore) {
        points -= (totalScore - maxDailyScore);
        totalScore = maxDailyScore;
    }

    const logList = document.getElementById("logList");
    const logItem = document.createElement("li");
    logItem.textContent = `${input}: +${points} очков (${foodItem.protein * portion}г белка, ${foodItem.carbs * portion}г углеводов, ${foodItem.fats * portion}г жиров)`;
    logList.appendChild(logItem);

    document.getElementById("score").textContent = `Очки: ${totalScore}`;
    document.getElementById("progress").innerHTML = `
        Прогресс:
        Белок <progress value="${proteinProgress}" max="1"></progress> ${Math.round(proteinProgress * 100)}%
        Углеводы <progress value="${carbsProgress}" max="1"></progress> ${Math.round(carbsProgress * 100)}%
        Жиры <progress value="${fatsProgress}" max="1"></progress> ${Math.round(fatsProgress * 100)}%`;
    document.getElementById("foodInput").value = "";

    const logEntry = {
        userId,
        date: new Date().toLocaleDateString(),
        food: input,
        points,
        calories: foodItem.calories * portion,
        protein: foodItem.protein * portion,
        carbs: foodItem.carbs * portion,
        fats: foodItem.fats * portion,
        usefulness: foodItem.usefulness,
        category: foodItem.category
    };
    userLog.push(logEntry);
    localStorage.setItem("userLog", JSON.stringify(userLog));

    updateRecommendation();
}

function showHungerPrompt() {
    const recommendationDiv = document.getElementById("recommendation");
    const options = getRecommendationOptions();
    recommendationDiv.textContent = `Голоден? Выбери:
        - ${options[0].food} (${options[0].points} очков, ${options[0].reason})
        - ${options[1].food} (${options[1].points} очков, ${options[1].reason})
        - ${options[2].food} (${options[2].points} очков, ${options[2].reason})`;
}

function getRecommendationOptions() {
    const proteinProgress = dailyMacros.protein / dailyGoals.protein;
    const carbsProgress = dailyMacros.carbs / dailyGoals.carbs;
    const fatsProgress = dailyMacros.fats / dailyGoals.fats;

    const options = [];
    const foods = Object.keys(foodDatabase);

    for (let i = 0; i < 3; i++) {
        let food = foods[Math.floor(Math.random() * foods.length)];
        let reason = "";
        if (proteinProgress < 0.8) reason = "Недостаток белка";
        else if (carbsProgress < 0.8) reason = "Недостаток углеводов";
        else if (fatsProgress < 0.8) reason = "Недостаток жиров";
        else reason = "Для баланса";

        options.push({
            food,
            points: foodDatabase[food].basePoints,
            reason
        });
    }

    return options;
}

function updateRecommendation() {
    const recommendationDiv = document.getElementById("recommendation");
    let message = "";
    const proteinProgress = dailyMacros.protein / dailyGoals.protein;
    const carbsProgress = dailyMacros.carbs / dailyGoals.carbs;
    const fatsProgress = dailyMacros.fats / dailyGoals.fats;

    if (proteinProgress < 0.5) {
        message = Math.random() > 0.5 ? 
            "Мало белка! Съешь курицу (+20 очков)." : 
            "Мало белка! Попробуй яйца (+15 очков).";
    } else if (proteinProgress > 1) {
        message = "Много белка! Добавь рис (+10 очков).";
    } else if (carbsProgress > 0.8) {
        message = "Много углеводов! Съешь орехи (+10 очков).";
    } else if (fatsProgress > 0.8) {
        message = "Много жиров! Попробуй картофель (+10 очков).";
    } else {
        message = "Баланс нормальный! Можно съесть авокадо (+10 очков).";
    }

    recommendationDiv.textContent = message;
}

function resetData() {
    totalScore = 0;
    dailyMacros = { calories: 0, protein: 0, carbs: 0, fats: 0 };
    userLog = [];
    localStorage.clear();
    document.getElementById("score").textContent = `Очки: 0`;
    document.getElementById("progress").innerHTML = `Прогресс: Белок <progress value="0" max="1"></progress> 0%, Углеводы <progress value="0" max="1"></progress> 0%, Жиры <progress value="0" max="1"></progress> 0%`;
    document.getElementById("logList").innerHTML = "";
    document.getElementById("recommendation").textContent = "";
}

function saveLogToExcel() {
    let csvContent = "UserID,Date,Food,Points,Calories,Protein,Carbs,Fats,Usefulness,Category\n";
    userLog.forEach(entry => {
        csvContent += `${entry.userId},${entry.date},${entry.food},${entry.points},${entry.calories},${entry.protein},${entry.carbs},${entry.fats},${entry.usefulness},${entry.category}\n`;
    });

    console.log("Лог для Excel:\n", csvContent);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${userId}_Log.csv`;
    link.click();
}

window.onload = function() {
    userLog = JSON.parse(localStorage.getItem("userLog")) || [];
    if (userLog.length > 0) {
        userId = userLog[0].userId;
        totalScore = 0;
        dailyMacros = { calories: 0, protein: 0, carbs: 0, fats: 0 };
        userLog.forEach(entry => {
            totalScore += entry.points;
            dailyMacros.calories += entry.calories;
            dailyMacros.protein += entry.protein;
            dailyMacros.carbs += entry.carbs;
            dailyMacros.fats += entry.fats;
            const logList = document.getElementById("logList");
            const logItem = document.createElement("li");
            logItem.textContent = `${entry.food}: +${entry.points} очков (${entry.protein}г белка, ${entry.carbs}г углеводов, ${entry.fats}г жиров)`;
            logList.appendChild(logItem);
        });
        document.getElementById("score").textContent = `Очки: ${totalScore}`;
        const proteinProgress = dailyMacros.protein / dailyGoals.protein;
        const carbsProgress = dailyMacros.carbs / dailyGoals.carbs;
        const fatsProgress = dailyMacros.fats / dailyGoals.fats;
        document.getElementById("progress").innerHTML = `
            Прогресс:
            Белок <progress value="${proteinProgress}" max="1"></progress> ${Math.round(proteinProgress * 100)}%
            Углеводы <progress value="${carbsProgress}" max="1"></progress> ${Math.round(carbsProgress * 100)}%
            Жиры <progress value="${fatsProgress}" max="1"></progress> ${Math.round(fatsProgress * 100)}%`;
        document.getElementById("profileForm").style.display = "none";
        document.getElementById("hungerButton").style.display = "block";
        document.getElementById("foodInput").style.display = "block";
        document.getElementById("logButton").style.display = "block";
        document.getElementById("resetButton").style.display = "block";
        document.getElementById("excelButton").style.display = "block";
        updateRecommendation();
    }
};
