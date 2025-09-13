// The existing JavaScript code remains unchanged
document.addEventListener('DOMContentLoaded', function () {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const particlesCount = window.innerWidth < 768 ? 120 : 200;
    const positions = new Float32Array(particlesCount * 3);
    const colors = new Float32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 10;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 6;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 10;

        // Particle color based on type: main node / data / alert
        const rand = Math.random();
        if (rand < 0.05) { // Key node = big invoice/db
            colors[i * 3] = 0.2;  // R
            colors[i * 3 + 1] = 0.8; // G
            colors[i * 3 + 2] = 0.2; // B
        } else if (rand < 0.8) { // normal data flow
            colors[i * 3] = 0.1;
            colors[i * 3 + 1] = 0.4;
            colors[i * 3 + 2] = 1.0;
        } else { // alert/warning
            colors[i * 3] = 1.0;
            colors[i * 3 + 1] = 0.6;
            colors[i * 3 + 2] = 0.0;
        }
    }

    const particlesGeometry = new THREE.BufferGeometry();
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particlesMaterial = new THREE.PointsMaterial({
        vertexColors: true,
        size: 0.03,
        transparent: true,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
    });

    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);

    // Lines for data flow
    const maxConnections = 3;
    const linePositions = new Float32Array(particlesCount * maxConnections * 2 * 3);
    const lineColors = new Float32Array(particlesCount * maxConnections * 2 * 3);

    const linesGeometry = new THREE.BufferGeometry();
    linesGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    linesGeometry.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));

    const linesMaterial = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.1,
        blending: THREE.AdditiveBlending
    });

    const lines = new THREE.LineSegments(linesGeometry, linesMaterial);
    scene.add(lines);

    camera.position.z = 5;
    const mouse = new THREE.Vector2();
    window.addEventListener('mousemove', (e) => {
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    const clock = new THREE.Clock();

    function animate() {
        const positions = particles.geometry.attributes.position.array;
        const colors = particles.geometry.attributes.color.array;
        let ptr = 0;

        for (let i = 0; i < particlesCount; i++) {
            // floating / orbit effect for billing nodes
            positions[i * 3 + 0] += Math.sin(clock.getElapsedTime() + i) * 0.001;
            positions[i * 3 + 1] += Math.cos(clock.getElapsedTime() + i) * 0.001;
        }
        particles.geometry.attributes.position.needsUpdate = true;

        // Connect nearest neighbors (max 3)
        for (let i = 0; i < particlesCount; i++) {
            const ix = positions[i * 3], iy = positions[i * 3 + 1], iz = positions[i * 3 + 2];
            let connections = 0;
            for (let j = 0; j < particlesCount && connections < maxConnections; j++) {
                if (i === j) continue;
                const dx = ix - positions[j * 3];
                const dy = iy - positions[j * 3 + 1];
                const dz = iz - positions[j * 3 + 2];
                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
                if (dist < 1.2) {
                    linePositions[ptr * 6] = ix;
                    linePositions[ptr * 6 + 1] = iy;
                    linePositions[ptr * 6 + 2] = iz;
                    linePositions[ptr * 6 + 3] = positions[j * 3];
                    linePositions[ptr * 6 + 4] = positions[j * 3 + 1];
                    linePositions[ptr * 6 + 5] = positions[j * 3 + 2];

                    // Gradient based on node type
                    lineColors[ptr * 6] = (colors[i * 3] + colors[j * 3]) / 2;
                    lineColors[ptr * 6 + 1] = (colors[i * 3 + 1] + colors[j * 3 + 1]) / 2;
                    lineColors[ptr * 6 + 2] = (colors[i * 3 + 2] + colors[j * 3 + 2]) / 2;
                    lineColors[ptr * 6 + 3] = lineColors[ptr * 6];
                    lineColors[ptr * 6 + 4] = lineColors[ptr * 6 + 1];
                    lineColors[ptr * 6 + 5] = lineColors[ptr * 6 + 2];

                    connections++;
                    ptr++;
                }
            }
        }

        lines.geometry.attributes.position.needsUpdate = true;
        lines.geometry.attributes.color.needsUpdate = true;

        // Rotate entire network subtly
        particles.rotation.y = clock.getElapsedTime() * 0.05;
        lines.rotation.y = clock.getElapsedTime() * 0.05;

        // Camera follow mouse
        camera.position.x += (mouse.x * 0.5 - camera.position.x) * 0.02;
        camera.position.y += (mouse.y * 0.5 - camera.position.y) * 0.02;
        camera.lookAt(scene.position);

        renderer.render(scene, camera);
        requestAnimationFrame(animate);
    }

    animate();

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Gemini API Integration
    const generateMessageBtn = document.getElementById('generateMessageBtn');
    const generatedMessage = document.getElementById('generatedMessage');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const errorMessage = document.getElementById('errorMessage');

    generateMessageBtn.addEventListener('click', async () => {
        const userName = document.getElementById('userName').value;
        const userContext = document.getElementById('userContext').value;
        const messageTone = document.getElementById('messageTone').value;

        if (!userName || !userContext) {
            alert('Please fill in your name and reason for contacting.');
            return;
        }

        loadingSpinner.classList.remove('hidden');
        generateMessageBtn.disabled = true;
        generatedMessage.value = 'Generating...';
        errorMessage.classList.add('hidden');

        const systemPrompt = `You are a professional communication assistant for JESSE EDWWING J., a skilled Billing Engineer (BSCS) and Full-Stack Developer from Madagascar. Your task is to draft a concise, professional, and engaging introductory contact message on behalf of a user who wants to get in touch with JESSE EDWWING.

                    JESSE EDWWING's skills include: Web Development, Mobile Development (Flutter, React Native), Database Administration (SQL), Linux, and Python.
                    
                    Generate a message based on the user's details and desired tone. The message should be addressed to JESSE EDWWING.`;

        const userQuery = `My name is ${userName}. I am contacting you from ${userContext}. Please draft a message for me to send to JESSE EDWWING with a ${messageTone} tone.`;

        const apiKey = ""; // You need to add your API key here
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

        const payload = {
            contents: [{ parts: [{ text: userQuery }] }],
            systemInstruction: {
                parts: [{ text: systemPrompt }]
            },
        };

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }

            const result = await response.json();
            const candidate = result.candidates?.[0];

            if (candidate && candidate.content?.parts?.[0]?.text) {
                generatedMessage.value = candidate.content.parts[0].text;
            } else {
                throw new Error('Unexpected response format from API.');
            }
        } catch (error) {
            console.error('Error calling Gemini API:', error);
            generatedMessage.value = '';
            errorMessage.classList.remove('hidden');
        } finally {
            loadingSpinner.classList.add('hidden');
            generateMessageBtn.disabled = false;
        }
    });
});