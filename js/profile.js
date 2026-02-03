function saveProfile() {
    const profile = {
        name: document.getElementById("name").value,
        department: document.getElementById("department").value,
        position: document.getElementById("position").value,
        email: document.getElementById("email").value,
        image: ""
    };

    if (!profile.name || !profile.department || !profile.position || !profile.email) {
        alert("Please fill out all fields.");
        return;
    }

    const photoInput = document.getElementById("photo");

    if (photoInput.files.length > 0) {
        const reader = new FileReader();
        reader.onload = function(e) {
            profile.image = e.target.result;
            localStorage.setItem("userProfile", JSON.stringify(profile));
            displayProfile(profile);
        };
        reader.readAsDataURL(photoInput.files[0]);
    } else {
        localStorage.setItem("userProfile", JSON.stringify(profile));
        displayProfile(profile);
    }
}

/* DISPLAY PROFILE */
function displayProfile(profile) {
    document.getElementById("displayName").textContent = profile.name;
    document.getElementById("displayDepartment").textContent = profile.department;
    document.getElementById("displayPosition").textContent = profile.position;
    document.getElementById("displayEmail").textContent = profile.email;

    if (profile.image) {
        document.getElementById("profileImage").src = profile.image;
    }

    document.getElementById("profileCard").style.display = "block";
}

/* LOAD PROFILE ON PAGE LOAD */
window.addEventListener("DOMContentLoaded", () => {
    const savedProfile = localStorage.getItem("userProfile");
    if (savedProfile) {
        displayProfile(JSON.parse(savedProfile));
    }
});