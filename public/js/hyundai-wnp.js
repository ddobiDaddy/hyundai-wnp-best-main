// 현대W&P 메인 페이지 JavaScript - 리팩토링된 버전

document.addEventListener('DOMContentLoaded', function() {
    try {
        // 핵심 기능 초기화 - 안전한 초기화
    initBannerSlider();
    initMobileMenu();
    initScrollAnimations();
    initSmoothScroll();
        initBannerButtons();
        
        
        console.log('현대W&P 웹사이트 초기화 완료');
    } catch (error) {
        console.error('웹사이트 초기화 중 오류 발생:', error);
    }
});

// 무한회전 슬라이더 - 예제 기반 구현
function initBannerSlider() {
    try {
        const track = document.getElementById('track');
        const viewport = document.getElementById('viewport');
        const prevBtn = document.querySelector('.carousel__btn--prev');
        const nextBtn = document.querySelector('.carousel__btn--next');
        const dotsContainer = document.getElementById('dots');
        const AUTOPLAY_MS = 5000;
        const SWIPE_THRESHOLD = 40;

        if (!track || !viewport) {
            console.warn('슬라이더 요소를 찾을 수 없습니다.');
            return;
        }

        let originalSlides = Array.from(track.children);
        let originalCount = originalSlides.length;

        let slidesPerView = computeSlidesPerView();
        let slideWidthPercent = 100 / slidesPerView;
        let index = slidesPerView; // start at first real slide after clones
        let isAnimating = false;
        let autoplayTimer = null;
        let slides = []; // all slides including clones

        // utility to compute slides per view based on viewport width
        function computeSlidesPerView() {
            const w = window.innerWidth;
            if (w >= 1920) return 4;
            if (w >= 1600) return 3;
            if (w >= 1200) return 2;
            return 1;
        }

        function clearTrack() {
            while (track.firstChild) track.removeChild(track.firstChild);
        }

        // gather original nodes from a hidden template by reading from an initial list saved in DOM
        const initialSlidesHTML = originalSlides.map(s => s.outerHTML);

        function rebuild() {
            // stop animations and timers
            pauseAutoplay();
            isAnimating = false;
            clearTrack();
            dotsContainer.innerHTML = '';

            slidesPerView = computeSlidesPerView();
            slideWidthPercent = 100 / slidesPerView;

            // set CSS variable for slide width
            document.documentElement.style.setProperty('--slides-per-view', slidesPerView);

            // create clones: last N clones to front, then originals, then first N clones to end
            const clonesBefore = [];
            const clonesAfter = [];

            // recreate original slide elements from saved HTML
            const originals = initialSlidesHTML.map(html => {
                const temp = document.createElement('div');
                temp.innerHTML = html.trim();
                return temp.firstChild;
            });

            // determine clones: clone last N and first N
            for (let i = originals.length - slidesPerView; i < originals.length; i++) {
                const idx = (i + originals.length) % originals.length;
                const clone = originals[idx].cloneNode(true);
                clone.dataset.clone = 'last';
                clonesBefore.push(clone);
            }
            for (let i = 0; i < originals.length; i++) {
                const node = originals[i].cloneNode(true);
                node.removeAttribute('data-clone');
                track.appendChild(node);
            }
            for (let i = 0; i < slidesPerView; i++) {
                const clone = originals[i].cloneNode(true);
                clone.dataset.clone = 'first';
                track.appendChild(clone);
            }

            // insert clonesBefore at the start
            for (let i = clonesBefore.length - 1; i >= 0; i--) {
                track.insertBefore(clonesBefore[i], track.firstChild);
            }

            // now update slides reference
            slides = Array.from(track.children);

            // initial index (start at first real slide)
            index = slidesPerView;
            setPositionByIndex(true);

            // build dots (one dot per original slide)
            makeDots();

            updateDots();
            startAutoplay();
        }

        function setPositionByIndex(noAnimation) {
            const translateX = -index * slideWidthPercent;
            if (noAnimation) {
                track.style.transition = 'none';
            } else {
                track.style.transition = '';
            }
            track.style.transform = `translateX(${translateX}%)`;
            if (noAnimation) track.getBoundingClientRect();
        }

        function makeDots() {
            for (let i = 0; i < originalCount; i++) {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.setAttribute('role', 'tab');
                btn.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
                btn.dataset.index = i;
                btn.addEventListener('click', () => {
                    // go to the clicked slide (real index + slidesPerView)
                    goToSlide(i + slidesPerView);
                    resetAutoplay();
                });
                dotsContainer.appendChild(btn);
            }
        }

        function updateDots() {
            const realIndex = (index - slidesPerView + originalCount) % originalCount;
            const all = Array.from(dotsContainer.children);
            all.forEach((b, i) => {
                b.setAttribute('aria-selected', i === realIndex ? 'true' : 'false');
            });
        }

        function goToSlide(targetIndex) {
            if (isAnimating) return;
            isAnimating = true;
            index = targetIndex;
            setPositionByIndex(false);
        }

        function next() {
            if (isAnimating) return;
            isAnimating = true;
            index++;
            setPositionByIndex(false);
        }

        function prev() {
            if (isAnimating) return;
            isAnimating = true;
            index--;
            setPositionByIndex(false);
        }

        track.addEventListener('transitionend', () => {
            isAnimating = false;
            // if moved into cloned-first area (after originals), jump back to real first
            if (slides[index] && slides[index].dataset.clone === 'first') {
                // jumped into the appended clones that are clones of first slides
                index = slidesPerView;
                setPositionByIndex(true);
            }
            // if moved into cloned-last area (before originals), jump to real last group
            if (slides[index] && slides[index].dataset.clone === 'last') {
                index = slides.length - slidesPerView - 1;
                // ensure index points to the correct item so that visible set matches end.
                setPositionByIndex(true);
            }
            updateDots();
        });

        // keyboard support
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') { prev(); resetAutoplay(); }
            if (e.key === 'ArrowRight') { next(); resetAutoplay(); }
        });

        // pointer/touch swipe
        let startX = 0;
        let deltaX = 0;
        let pointerDown = false;

        viewport.addEventListener('pointerdown', (e) => {
            pointerDown = true;
            startX = e.clientX;
            track.style.transition = 'none';
            try { viewport.setPointerCapture(e.pointerId); } catch (e) { }
            pauseAutoplay();
        });

        viewport.addEventListener('pointermove', (e) => {
            if (!pointerDown) return;
            deltaX = e.clientX - startX;
            const percent = (deltaX / viewport.offsetWidth) * 100;
            const baseTranslate = -index * slideWidthPercent;
            track.style.transform = `translateX(${baseTranslate + percent}%)`;
        });

        function endPointer() {
            if (!pointerDown) return;
            pointerDown = false;
            track.style.transition = '';
            if (Math.abs(deltaX) > SWIPE_THRESHOLD) {
                if (deltaX > 0) prev(); else next();
            } else {
                setPositionByIndex(false);
            }
            deltaX = 0;
            resetAutoplay();
        }

        viewport.addEventListener('pointerup', endPointer);
        viewport.addEventListener('pointercancel', endPointer);
        viewport.addEventListener('pointerleave', endPointer);

        // autoplay control
        function startAutoplay() {
            if (autoplayTimer) return;
            autoplayTimer = setInterval(() => {
                next();
            }, AUTOPLAY_MS);
        }

        function pauseAutoplay() {
            if (autoplayTimer) { clearInterval(autoplayTimer); autoplayTimer = null; }
        }

        function resetAutoplay() {
            pauseAutoplay();
            startAutoplay();
        }

        // pause on hover/focus
        viewport.addEventListener('mouseenter', pauseAutoplay);
        viewport.addEventListener('mouseleave', resetAutoplay);
        viewport.addEventListener('focusin', pauseAutoplay);
        viewport.addEventListener('focusout', resetAutoplay);

        // buttons
        prevBtn.addEventListener('click', () => { prev(); resetAutoplay(); });
        nextBtn.addEventListener('click', () => { next(); resetAutoplay(); });

        // visibility change (tab hidden) pause
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) pauseAutoplay(); else resetAutoplay();
        });

        // rebuild on resize (debounced)
        let resizeTimer = null;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                // only rebuild if slidesPerView would change
                const newSpv = computeSlidesPerView();
                if (newSpv !== slidesPerView) {
                    // rebuild whole structure
                    originalSlides = Array.from(track.querySelectorAll('.carousel__slide')).filter(s => !s.dataset.clone);
                    // reset initialSlidesHTML based on current originals
                    // But we preserved initialSlidesHTML earlier; use that for consistent content
                    rebuild();
                } else {
                    // nothing
                }
            }, 200);
        });

        // init
        rebuild();

        console.log('무한회전 슬라이더 초기화 완료');
    } catch (error) {
        console.error('배너 슬라이더 초기화 실패:', error);
    }
}



// 모바일 메뉴 토글 - 핵심 기능
function initMobileMenu() {
    try {
    const navToggle = document.querySelector('.nav-toggle');
    const nav = document.querySelector('.nav');
    
        if (!navToggle || !nav) {
            console.warn('모바일 메뉴 요소를 찾을 수 없습니다.');
            return;
        }
    
    navToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        nav.classList.toggle('open');
    });
    
    // 메뉴 외부 클릭 시 닫기
    document.addEventListener('click', (e) => {
        if (!nav.contains(e.target) && !navToggle.contains(e.target)) {
            nav.classList.remove('open');
        }
    });
    } catch (error) {
        console.error('모바일 메뉴 초기화 실패:', error);
    }
}


// 스크롤 애니메이션 - 성능 최적화
function initScrollAnimations() {
    try {
        if (!('IntersectionObserver' in window)) {
            console.warn('IntersectionObserver를 지원하지 않는 브라우저입니다.');
            return;
        }

    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // 애니메이션 대상 요소들 관찰
        const animateElements = document.querySelectorAll('.service-item');
    animateElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
    } catch (error) {
        console.error('스크롤 애니메이션 초기화 실패:', error);
    }
}

// 부드러운 스크롤 - 핵심 기능
function initSmoothScroll() {
    try {
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    
    anchorLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const targetId = link.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                e.preventDefault();
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    } catch (error) {
        console.error('부드러운 스크롤 초기화 실패:', error);
    }
}

// 배너 버튼 기능 - 크린토피아 스타일
function initBannerButtons() {
    try {
        const bannerButtons = document.querySelectorAll('.banner-buttons .btn');
        
        bannerButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const href = btn.getAttribute('href');
                
                // 앵커 링크가 아닌 경우에만 처리
                if (href && !href.startsWith('#')) {
                    // 실제 링크로 이동
                    return;
                }
                
                // 앵커 링크인 경우 스크롤 처리
                if (href && href.startsWith('#')) {
                    e.preventDefault();
                    const targetId = href.substring(1);
                    const targetElement = document.getElementById(targetId);
                    
                    if (targetElement) {
                        targetElement.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    } else {
                        // 해당 섹션이 없으면 적절한 섹션으로 이동
                        handleBannerButtonClick(targetId);
                    }
                }
            });
        });
    } catch (error) {
        console.error('배너 버튼 초기화 실패:', error);
    }
}

// 배너 버튼 클릭 처리
function handleBannerButtonClick(targetId) {
    switch(targetId) {
        case 'consult':
        case 'franchise':
            // 상담 문의 섹션으로 스크롤 (비즈니스 섹션)
            const businessSection = document.querySelector('.business-section');
            if (businessSection) {
                businessSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            break;
        case 'business-info':
        case 'franchise-info':
            // 회사 소개 섹션으로 스크롤
            const companySection = document.querySelector('.company-section');
            if (companySection) {
                companySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            break;
        default:
            // 기본적으로 서비스 섹션으로 이동
            const serviceSection = document.querySelector('.service-menu');
            if (serviceSection) {
                serviceSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
    }
}

// 매장 검색 기능 - 메인 페이지에서 사용
function initStoreSearch() {
    const searchForm = document.querySelector('.store-search-form');
    const searchInput = document.querySelector('.search-input');
    const categoryBtns = document.querySelectorAll('.category-btn');
    
    if (searchForm && searchInput) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const searchTerm = searchInput.value.trim();
            if (searchTerm) {
                alert(`"${searchTerm}"에 대한 매장을 검색합니다.\n(실제 검색 기능은 구현되지 않았습니다.)`);
                searchInput.value = '';
            }
        });
    }
    
    // 카테고리 버튼 이벤트
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            categoryBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const category = btn.textContent;
            alert(`${category} 카테고리를 선택했습니다.\n(실제 필터 기능은 구현되지 않았습니다.)`);
        });
    });
}

// 매장 검색 초기화 (메인 페이지에서만)
if (document.querySelector('.store-search-form')) {
    document.addEventListener('DOMContentLoaded', initStoreSearch);
}

// 로딩 상태 관리 - 최적화
function showLoading() {
    const loader = document.createElement('div');
    loader.id = 'pageLoader';
    loader.innerHTML = `
        <div style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255, 255, 255, 0.9);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
        ">
            <div style="
                width: 50px;
                height: 50px;
                border: 3px solid #f3f3f3;
                border-top: 3px solid #0066cc;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            "></div>
        </div>
        <style>
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    `;
    document.body.appendChild(loader);
}

function hideLoading() {
    const loader = document.getElementById('pageLoader');
    if (loader) {
        loader.remove();
    }
}

// 페이지 로드 완료 시 로딩 숨기기
window.addEventListener('load', hideLoading);