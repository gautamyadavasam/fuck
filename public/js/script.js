document.addEventListener("DOMContentLoaded", () => {
    const registerForm = document.getElementById("registerForm");
    if (registerForm) {
        registerForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const name = document.getElementById("name").value;
            const email = document.getElementById("email").value;
            const phone = document.getElementById("phone").value;
            const password = document.getElementById("password").value;

            const res = await fetch("http://localhost:3000/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, phone, password }),
            });

            const data = await res.json();
            alert(data.message);
        });
    }

    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const email = document.getElementById("email").value;
            const password = document.getElementById("password").value;

            const res = await fetch("http://localhost:3000/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();
            if (data.token) {
                localStorage.setItem("token", data.token);
                alert("Login successful!");
                window.location.href = "profile.html";
            } else {
                alert("Invalid credentials");
            }
        });
    }

    const profileInfo = document.getElementById("profileInfo");
    if (profileInfo) {
        const token = localStorage.getItem("token");
        if (!token) {
            alert("Please login first");
            window.location.href = "login.html";
        }
    }

    const donationsList = document.getElementById("donationsList");
    if (donationsList) {
        fetch("http://localhost:3000/donations")
            .then(res => res.json())
            .then(data => {
                data.forEach(donation => {
                    const li = document.createElement("li");
                    li.innerText = `${donation.name} donated ₹${donation.amount}`;
                    donationsList.appendChild(li);
                });
            });
    }
});
async function fetchImages(category, elementId) {
    try {
        const res = await fetch(`http://localhost:3000/images/${category}`);
        const images = await res.json();
        const container = document.querySelector(`#${elementId} .image-container`);

        if (images.length === 0) return;

        images.forEach((img, index) => {
            const imgTag = document.createElement("img");
            imgTag.src = `http://localhost:3000/uploads/${img.filename}`;
            if (index === 0) imgTag.classList.add("active");
            container.appendChild(imgTag);
        });

        let currentIndex = 0;
        setInterval(() => {
            const imgElements = container.querySelectorAll("img");
            imgElements[currentIndex].classList.remove("active");
            currentIndex = (currentIndex + 1) % imgElements.length;
            imgElements[currentIndex].classList.add("active");
        }, 10000);
    } catch (error) {
        console.error("Error loading images:", error);
    }
}

// Fetch images for each category
fetchImages("education", "education");
fetchImages("healthcare", "healthcare");
fetchImages("food", "food");
