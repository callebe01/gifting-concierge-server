document.addEventListener('DOMContentLoaded', function() {
    const tabElements = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    const generateIdeasButton = document.getElementById('generate-ideas');
    const descriptionInput = document.getElementById('description-input');
    const randomIdeasContainer = document.getElementById('random-ideas');
    const trendingIdeasContainer = document.getElementById('trending-ideas');

    let trendingGiftsLoaded = false;

    // Update this URL with your actual Vercel deployment URL
    const API_URL = 'https://gifting-concierge-server.vercel.app';

    tabElements.forEach(tab => {
        tab.addEventListener('click', () => {
            tabElements.forEach(t => t.classList.remove('active'));
            tabContents.forEach(tc => tc.classList.remove('active'));
            tab.classList.add('active');
            const tabContent = document.getElementById(tab.dataset.tab);
            tabContent.classList.add('active');

            if (tab.dataset.tab === 'tab2' && !trendingGiftsLoaded) {
                loadTrendingGifts();
                trendingGiftsLoaded = true;
            }
        });
    });

    generateIdeasButton.addEventListener('click', generateIdeas);

    descriptionInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            generateIdeas();
        }
    });

    loadRandomGiftIdeas();

    async function generateIdeas() {
        const description = descriptionInput.value;
        if (!description.trim()) {
            alert('Please provide a description.');
            return;
        }
        setLoadingState(true);
        try {
            const giftIdeas = await generateGiftIdeasDescription(description);
            displayResults(giftIdeas);
        } catch (error) {
            console.error('Error generating gift ideas:', error);
            alert('An error occurred while generating gift ideas. Please try again.');
        } finally {
            setLoadingState(false);
        }
    }

    async function generateGiftIdeasDescription(description) {
        const response = await fetch(`${API_URL}/generate-gift-ideas-description`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ description })
        });

        if (!response.ok) {
            throw new Error('Failed to generate gift ideas');
        }

        return await response.json();
    }

    function displayResults(giftIdeas) {
        const content = document.querySelector('.content');
        content.innerHTML = `
            <button id="back-button" class="secondary-button">Back to Search</button>
            <div id="results"></div>
        `;
        const resultsContainer = document.getElementById('results');
        const backButton = document.getElementById('back-button');

        if (giftIdeas && giftIdeas.length > 0) {
            giftIdeas.forEach(gift => {
                const giftElement = createGiftElement(gift);
                resultsContainer.appendChild(giftElement);
            });
        } else {
            resultsContainer.innerHTML = '<p>No gift ideas found.</p>';
        }

        backButton.addEventListener('click', () => {
            location.reload();
        });
    }

    function createGiftElement(gift) {
        const giftElement = document.createElement('div');
        giftElement.className = 'gift-item';
        giftElement.innerHTML = `
            <div class="gift-icon">${getRelevantIcon(gift.name)}</div>
            <div class="gift-details">
                <div class="gift-name">${gift.name}</div>
                <div class="gift-description">View on Amazon</div>
            </div>
            <div class="gift-discount">${getRandomPriceRange()}</div>
        `;
        giftElement.addEventListener('click', () => {
            window.open(gift.link, '_blank');
        });
        return giftElement;
    }

    async function loadRandomGiftIdeas() {
        try {
            const response = await fetch(`${API_URL}/generate-gift-ideas`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    gender: 'all',
                    ageGroup: 'all',
                    interests: ['popular'],
                    maxPrice: '1000'
                })
            });

            if (!response.ok) {
                throw new Error('Failed to generate random gift ideas');
            }

            const giftIdeas = await response.json();
            randomIdeasContainer.innerHTML = '';
            giftIdeas.forEach(gift => {
                const giftElement = createGiftElement(gift);
                randomIdeasContainer.appendChild(giftElement);
            });
        } catch (error) {
            console.error('Error loading random gift ideas:', error);
            randomIdeasContainer.innerHTML = 'Failed to load random gift ideas. Please try again later.';
        }
    }

    async function loadTrendingGifts() {
        try {
            const response = await fetch(`${API_URL}/generate-gift-ideas`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    gender: 'all',
                    ageGroup: 'all',
                    interests: ['trending'],
                    maxPrice: '1000'
                })
            });

            if (!response.ok) {
                throw new Error('Failed to generate trending gift ideas');
            }

            const giftIdeas = await response.json();
            trendingIdeasContainer.innerHTML = '';
            giftIdeas.forEach((gift) => {
                const giftElement = createGiftElement(gift);
                trendingIdeasContainer.appendChild(giftElement);
            });
        } catch (error) {
            console.error('Error loading trending gift ideas:', error);
            trendingIdeasContainer.innerHTML = 'Failed to load trending gifts. Please try again later.';
        }
    }

    function getRelevantIcon(itemName) {
        if (itemName.toLowerCase().includes('watch')) return '⌚';
        if (itemName.toLowerCase().includes('laptop') || itemName.toLowerCase().includes('computer')) return '💻';
        if (itemName.toLowerCase().includes('phone') || itemName.toLowerCase().includes('tablet')) return '📱';
        if (itemName.toLowerCase().includes('headphone') || itemName.toLowerCase().includes('earbud')) return '🎧';
        if (itemName.toLowerCase().includes('book')) return '📚';
        if (itemName.toLowerCase().includes('toy') || itemName.toLowerCase().includes('game')) return '🧸';
        if (itemName.toLowerCase().includes('clothing') || itemName.toLowerCase().includes('apparel')) return '👗';
        return '🎁'; // Default gift icon
    }

    function getRandomPriceRange() {
        const minPrice = Math.floor(Math.random() * 50) + 20;
        const maxPrice = minPrice + Math.floor(Math.random() * 50) + 30;
        return `$${minPrice} - $${maxPrice}`;
    }

    function setLoadingState(isLoading) {
        if (isLoading) {
            generateIdeasButton.disabled = true;
            generateIdeasButton.innerHTML = '<span class="spinner"></span> Generating...';
        } else {
            generateIdeasButton.disabled = false;
            generateIdeasButton.innerHTML = 'Generate Ideas';
        }
    }
});
