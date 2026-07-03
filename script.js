document.addEventListener('DOMContentLoaded', () => {
    // Smooth scrolling for anchor links (if not fully supported by CSS)
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Intersection Observer for scroll animations (fade-in)
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Optional: Stop observing once visible if you only want it to animate once
                // observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const fadeElements = document.querySelectorAll('.fade-in');
    fadeElements.forEach(el => {
        observer.observe(el);
    });

    // Publication Item Expand
    const pubRows = document.querySelectorAll('.pub-row');
    pubRows.forEach(row => {
        row.addEventListener('click', (e) => {
            // Don't toggle if clicking on a link
            if (e.target.tagName.toLowerCase() === 'a' || e.target.closest('a')) return;
            row.classList.toggle('expanded');
        });
    });

    // Experience Project Expand
    const expProjectHeaders = document.querySelectorAll('.exp-project-header');
    expProjectHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const item = header.parentElement;
            item.classList.toggle('expanded');
        });
    });

    // Projects Carousel Center Snap Detection & Infinite Loop
    const carouselContainer = document.querySelector('.projects-carousel');
    let carouselCards = document.querySelectorAll('.project-carousel-card');

    if (carouselContainer && carouselCards.length > 1) {
        
        // 1. Clone cards for infinite loop
        const firstCardClone = carouselCards[0].cloneNode(true);
        const lastCardClone = carouselCards[carouselCards.length - 1].cloneNode(true);
        
        firstCardClone.classList.add('clone');
        lastCardClone.classList.add('clone');
        
        carouselContainer.appendChild(firstCardClone);
        carouselContainer.insertBefore(lastCardClone, carouselCards[0]);
        
        // Re-select cards after cloning
        carouselCards = document.querySelectorAll('.project-carousel-card');
        const numOriginalCards = carouselCards.length - 2;
        
        // 2. Initial setup
        const cardWidthWithGap = 590; // 560px + 30px gap
        let isTeleporting = false;
        
        // Move to the first real card (index 1 because index 0 is the clone of the last card)
        setTimeout(() => {
            carouselContainer.scrollTo({ left: cardWidthWithGap, behavior: 'instant' });
            updateCenteredCard();
        }, 50);

        const updateCenteredCard = () => {
            const containerCenter = carouselContainer.offsetWidth / 2;
            let closestCard = null;
            let minDistance = Infinity;

            carouselCards.forEach(card => {
                const cardCenter = (card.offsetLeft - carouselContainer.offsetLeft) + (card.offsetWidth / 2) - carouselContainer.scrollLeft;
                const distance = Math.abs(containerCenter - cardCenter);
                
                if (distance < minDistance) {
                    minDistance = distance;
                    closestCard = card;
                }
            });

            if (closestCard && !closestCard.classList.contains('centered')) {
                carouselCards.forEach(card => card.classList.remove('centered'));
                closestCard.classList.add('centered');
            }
        };

        // 3. Infinite Scroll Logic
        let scrollTimeout;
        const handleScrollEnd = () => {
            if (isTeleporting) return;
            
            // Sử dụng điểm giữa (midpoint) để kiểm tra chính xác thẻ nào đang được snap tới (tránh lỗi pixel lẻ)
            if (carouselContainer.scrollLeft < cardWidthWithGap / 2) {
                // Reached start (clone of last), teleport to real last
                isTeleporting = true;
                carouselContainer.scrollTo({ left: cardWidthWithGap * numOriginalCards, behavior: 'instant' });
                setTimeout(() => isTeleporting = false, 50);
            } else if (carouselContainer.scrollLeft > cardWidthWithGap * numOriginalCards + cardWidthWithGap / 2) {
                // Reached end (clone of first), teleport to real first
                isTeleporting = true;
                carouselContainer.scrollTo({ left: cardWidthWithGap, behavior: 'instant' });
                setTimeout(() => isTeleporting = false, 50);
            }
        };

        carouselContainer.addEventListener('scroll', () => {
            window.requestAnimationFrame(updateCenteredCard);
            
            // Fallback polyfill for scrollend
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(handleScrollEnd, 150);
        });

        carouselContainer.addEventListener('scrollend', handleScrollEnd);

        // 4. Navigation Buttons Logic
        const prevBtn = document.querySelector('.prev-btn');
        const nextBtn = document.querySelector('.next-btn');

        if (prevBtn && nextBtn) {
            prevBtn.addEventListener('click', () => {
                if(isTeleporting) return;
                // Tính toán chính xác vị trí thẻ tiếp theo để cuộn tới (thay vì scrollBy dễ bị lỗi snap)
                const currentScroll = carouselContainer.scrollLeft;
                const targetScroll = Math.round(currentScroll / cardWidthWithGap - 1) * cardWidthWithGap;
                carouselContainer.scrollTo({ left: targetScroll, behavior: 'smooth' });
            });

            nextBtn.addEventListener('click', () => {
                if(isTeleporting) return;
                const currentScroll = carouselContainer.scrollLeft;
                const targetScroll = Math.round(currentScroll / cardWidthWithGap + 1) * cardWidthWithGap;
                carouselContainer.scrollTo({ left: targetScroll, behavior: 'smooth' });
            });
        }

        // 5. Click on side cards to center them
        carouselCards.forEach((card, index) => {
            card.addEventListener('click', () => {
                if (!card.classList.contains('centered') && !isTeleporting) {
                    const targetScroll = cardWidthWithGap * index;
                    carouselContainer.scrollTo({ left: targetScroll, behavior: 'smooth' });
                }
            });
        });

        // 6. Auto-play Logic
        let autoPlayInterval;
        const startAutoPlay = () => {
            autoPlayInterval = setInterval(() => {
                if (!isTeleporting) {
                    const currentScroll = carouselContainer.scrollLeft;
                    const targetScroll = Math.round(currentScroll / cardWidthWithGap + 1) * cardWidthWithGap;
                    carouselContainer.scrollTo({ left: targetScroll, behavior: 'smooth' });
                }
            }, 4000); // Tự động cuộn sau 4 giây
        };

        const stopAutoPlay = () => {
            clearInterval(autoPlayInterval);
        };

        // Pause on hover
        const carouselSection = document.querySelector('.projects-carousel-container');
        if (carouselSection) {
            carouselSection.addEventListener('mouseenter', stopAutoPlay);
            carouselSection.addEventListener('mouseleave', startAutoPlay);
            // Support touch devices (pause when touching)
            carouselSection.addEventListener('touchstart', stopAutoPlay);
            carouselSection.addEventListener('touchend', startAutoPlay);
        }

        // Bắt đầu Auto-play ngay lập tức
        startAutoPlay();
        
        window.addEventListener('resize', () => {
            window.requestAnimationFrame(updateCenteredCard);
        });
    }
    
    // 8. Image Modal Logic
    const modal = document.getElementById("image-modal");
    const modalImg = document.getElementById("modal-img");
    const closeBtn = document.querySelector(".close-modal");

    if (modal && modalImg && closeBtn) {
        document.querySelectorAll(".hanging-frame img").forEach(img => {
            img.style.cursor = "pointer";
            img.addEventListener("click", function() {
                modal.style.display = "flex";
                modalImg.src = this.src;
            });
        });

        closeBtn.addEventListener("click", function() {
            modal.style.display = "none";
        });

        modal.addEventListener("click", function(e) {
            if(e.target === modal) {
                modal.style.display = "none";
            }
        });
    }
});
