// 현대W&P 메인 페이지 JavaScript - 리팩토링된 버전

document.addEventListener('DOMContentLoaded', function() {
    try {
        // 핵심 기능 초기화 - 안전한 초기화
        initBannerSlider();
        initMobileMenu();
        initScrollAnimations();
        initSmoothScroll();
        initTouchZoomPrevention();
        // initBannerButtons(); // 배너 버튼은 순수 HTML 링크로 동작
        
        
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

        // 터치 스와이프 이벤트 개선
        let startX = 0;
        let startY = 0;
        let deltaX = 0;
        let deltaY = 0;
        let pointerDown = false;
        let isScrolling = false;

        viewport.addEventListener('pointerdown', (e) => {
            // 버튼이나 링크 클릭인 경우 슬라이더 이벤트 무시
            if (e.target.closest('a, button')) {
                return;
            }
            
            pointerDown = true;
            startX = e.clientX;
            startY = e.clientY;
            deltaX = 0;
            deltaY = 0;
            isScrolling = false;
            
            track.style.transition = 'none';
            try { viewport.setPointerCapture(e.pointerId); } catch (e) { }
            pauseAutoplay();
            
            // 기본 터치 동작 방지 (스크롤, 확대 등)
            e.preventDefault();
        });

        viewport.addEventListener('pointermove', (e) => {
            if (!pointerDown) return;
            
            deltaX = e.clientX - startX;
            deltaY = e.clientY - startY;
            
            // 수직 스크롤인지 확인 (수직 이동이 수평 이동보다 클 때)
            if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 10) {
                isScrolling = true;
                return; // 수직 스크롤이면 슬라이더 동작 중단
            }
            
            // 수평 스와이프인 경우에만 슬라이더 동작
            if (!isScrolling) {
                const percent = (deltaX / viewport.offsetWidth) * 100;
                const baseTranslate = -index * slideWidthPercent;
                track.style.transform = `translateX(${baseTranslate + percent}%)`;
                
                // 수평 스와이프 시 기본 동작 방지
                e.preventDefault();
            }
        });

        function endPointer() {
            if (!pointerDown) return;
            pointerDown = false;
            track.style.transition = '';
            
            // 스크롤 중이었다면 슬라이더 동작하지 않음
            if (isScrolling) {
                setPositionByIndex(false);
                deltaX = 0;
                deltaY = 0;
                resetAutoplay();
                return;
            }
            
            // 수평 스와이프인 경우에만 슬라이더 변경
            if (Math.abs(deltaX) > SWIPE_THRESHOLD && Math.abs(deltaX) > Math.abs(deltaY)) {
                if (deltaX > 0) {
                    prev();
                } else {
                    next();
                }
            } else {
                setPositionByIndex(false);
            }
            
            deltaX = 0;
            deltaY = 0;
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
                
                // 실제 링크인 경우 (앵커가 아닌 경우) - 기본 동작 허용
                if (href && !href.startsWith('#')) {
                    // 실제 링크로 이동 - 기본 동작 허용
                    console.log('실제 링크로 이동:', href);
                    return; // 기본 동작 허용
                }
                
                // 앵커 링크인 경우에만 preventDefault 사용
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

// 견적 폼 검증 및 포커싱 개선
function initEstimateForm() {
    const estimateForm = document.getElementById('estimateForm');
    if (!estimateForm) {
        console.log('견적 폼을 찾을 수 없습니다.');
        return;
    }
    console.log('견적 폼 초기화 시작');

    estimateForm.addEventListener('submit', function(e) {
        e.preventDefault();
        console.log('견적 폼 제출 시도');
        
        // 필수 필드들 정의 (순서대로)
        const requiredFields = [
            { id: 'companyName', name: '업체명/성함' },
            { id: 'contactName', name: '담당자명' },
            { id: 'phone', name: '연락처' },
            { id: 'email', name: '이메일' },
            { id: 'serviceType', name: '서비스 유형' },
            { id: 'laundryType', name: '세탁물 종류' },
            { id: 'quantity', name: '세탁물 수량' },
            { id: 'frequency', name: '세탁 빈도' },
            { id: 'location', name: '수거/배송 지역' }
        ];

        // 보안 검증 함수
        function sanitizeInput(value) {
            if (!value) return '';
            return value
                .replace(/[<>]/g, '') // HTML 태그 제거
                .replace(/javascript:/gi, '') // JavaScript 프로토콜 제거
                .replace(/on\w+\s*=/gi, '') // 이벤트 핸들러 제거
                .replace(/script/gi, '') // script 태그 제거
                .trim();
        }

        // 이메일 검증 함수
        function validateEmail(email) {
            const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            return emailRegex.test(email);
        }

        // 전화번호 검증 함수
        function validatePhone(phone) {
            const phoneRegex = /^[0-9-+\s()]+$/;
            return phoneRegex.test(phone) && phone.replace(/[^0-9]/g, '').length >= 10;
        }

        // 첫 번째 오류 필드 찾기
        let firstErrorField = null;
        
        for (const field of requiredFields) {
            const element = document.getElementById(field.id);
            if (!element) continue;
            
            const value = sanitizeInput(element.value);
            element.value = value; // 정화된 값으로 업데이트
            
            // 빈 값 체크
            if (!value) {
                firstErrorField = element;
                break;
            }
            
            // 이메일 검증
            if (field.id === 'email' && !validateEmail(value)) {
                firstErrorField = element;
                alert('올바른 이메일 형식을 입력해주세요.');
                break;
            }
            
            // 전화번호 검증
            if (field.id === 'phone' && !validatePhone(value)) {
                firstErrorField = element;
                alert('올바른 전화번호를 입력해주세요. (최소 10자리)');
                break;
            }
        }

        // 오류가 있으면 첫 번째 오류 필드로 포커싱
        if (firstErrorField) {
            // CSS scroll-margin-top이 자동으로 헤더 높이만큼 여유를 둠
            firstErrorField.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start',
                inline: 'nearest'
            });
            
            // 포커스 적용
            firstErrorField.focus();
            
            // 필드 하이라이트 효과
            firstErrorField.style.borderColor = '#ff4444';
            firstErrorField.style.boxShadow = '0 0 0 2px rgba(255, 68, 68, 0.2)';
            firstErrorField.style.backgroundColor = '#fff5f5';
            
            // 3초 후 하이라이트 제거
            setTimeout(() => {
                firstErrorField.style.borderColor = '';
                firstErrorField.style.boxShadow = '';
                firstErrorField.style.backgroundColor = '';
            }, 3000);
            
            return false;
        }

        // 모든 필드가 유효하면 DB에 저장
        if (firstErrorField === null) {
            submitEstimateToDB();
        }
    });
}

// DB에 견적 문의 제출 함수
async function submitEstimateToDB() {
    const formData = {
        companyName: document.getElementById('companyName').value,
        contactName: document.getElementById('contactName').value,
        phone: document.getElementById('phone').value,
        email: document.getElementById('email').value,
        serviceType: document.getElementById('serviceType').value,
        laundryType: document.getElementById('laundryType').value,
        quantity: document.getElementById('quantity').value,
        frequency: document.getElementById('frequency').value,
        location: document.getElementById('location').value,
        specialRequirements: document.getElementById('specialRequirements').value,
        message: document.getElementById('message').value
    };

    console.log('견적 문의 데이터:', formData);

    try {
        // 서버에 POST 요청
        const response = await fetch('/estimate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();
        
        if (result.success) {
            // 성공 시 폼 리셋
            document.getElementById('estimateForm').reset();
            
            // 성공 메시지 표시
            alert(result.message);
            console.log('견적 문의 저장 완료:', result.estimateId);
        } else {
            // 오류 메시지 표시
            alert(result.message);
            console.error('견적 문의 저장 실패:', result.message);
        }
        
    } catch (error) {
        console.error('견적 문의 제출 오류:', error);
        alert('견적 문의 제출 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
}

// 이미지 모달 기능
function openImageModal(imageSrc, title, description) {
    try {
        // 기존 모달이 있다면 제거
        const existingModal = document.getElementById('imageModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // 모달 HTML 생성
        const modalHTML = `
            <div id="imageModal" class="image-modal">
                <div class="image-modal-content">
                    <span class="image-modal-close" onclick="closeImageModal()">&times;</span>
                    <img src="${imageSrc}" alt="${title}" loading="lazy" />
                    <div class="image-modal-info">
                        <h3>${title}</h3>
                        <p>${description}</p>
                    </div>
                </div>
            </div>
        `;
        
        // 모달을 body에 추가
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        const modal = document.getElementById('imageModal');
        
        // 스크롤 방지
        document.body.style.overflow = 'hidden';
        
        // 모달 표시
        modal.style.display = 'block';
        
        // 애니메이션을 위해 다음 프레임에서 show 클래스 추가
        requestAnimationFrame(() => {
            modal.classList.add('show');
        });
        
        // ESC 키로 닫기
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                closeImageModal();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
        
        // 배경 클릭으로 닫기
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeImageModal();
            }
        });
        
    } catch (error) {
        console.error('이미지 모달 열기 오류:', error);
    }
}

function closeImageModal() {
    try {
        const modal = document.getElementById('imageModal');
        if (modal) {
            // 애니메이션 제거
            modal.classList.remove('show');
            
            // 애니메이션 완료 후 모달 제거
            setTimeout(() => {
                modal.remove();
                document.body.style.overflow = '';
            }, 300);
        }
    } catch (error) {
        console.error('이미지 모달 닫기 오류:', error);
    }
}

// 터치 확대 방지 기능
function initTouchZoomPrevention() {
    try {
        let lastTouchEnd = 0;
        let touchCount = 0;
        let touchStartTime = 0;
        
        // 더블탭 확대 방지
        document.addEventListener('touchend', function(event) {
            const now = (new Date()).getTime();
            
            // 연속된 터치 감지
            if (now - lastTouchEnd <= 300) {
                touchCount++;
                if (touchCount >= 2) {
                    event.preventDefault();
                    event.stopPropagation();
                    return false;
                }
            } else {
                touchCount = 1;
            }
            
            lastTouchEnd = now;
        }, { passive: false });
        
        // 핀치 줌 방지
        document.addEventListener('touchstart', function(event) {
            if (event.touches.length > 1) {
                event.preventDefault();
                event.stopPropagation();
                return false;
            }
        }, { passive: false });
        
        document.addEventListener('touchmove', function(event) {
            if (event.touches.length > 1) {
                event.preventDefault();
                event.stopPropagation();
                return false;
            }
        }, { passive: false });
        
        // 키보드 줌 방지 (Ctrl + +, Ctrl + -)
        document.addEventListener('keydown', function(event) {
            if ((event.ctrlKey || event.metaKey) && (event.keyCode === 61 || event.keyCode === 107 || event.keyCode === 173 || event.keyCode === 109 || event.keyCode === 187 || event.keyCode === 189)) {
                event.preventDefault();
                return false;
            }
        });
        
        // 마우스 휠 줌 방지
        document.addEventListener('wheel', function(event) {
            if (event.ctrlKey || event.metaKey) {
                event.preventDefault();
                return false;
            }
        }, { passive: false });
        
        console.log('터치 확대 방지 기능이 활성화되었습니다.');
        
    } catch (error) {
        console.error('터치 확대 방지 초기화 오류:', error);
    }
}

// 서비스 유형 텍스트 변환
function getServiceTypeText(value) {
    const types = {
        'health': '헬스·스포츠센터 세탁',
        'sauna': '대형사우나·찜질방 세탁',
        'corporate': '기업체 연수원 세탁',
        'school': '학교·학원 세탁',
        'other': '기타'
    };
    return types[value] || value;
}

// 세탁물 종류 텍스트 변환
function getLaundryTypeText(value) {
    const types = {
        'workout': '운동복',
        'towel': '수건',
        'sauna': '사우나복',
        'uniform': '제복',
        'bedding': '침구류',
        'mixed': '혼합'
    };
    return types[value] || value;
}

// 세탁 빈도 텍스트 변환
function getFrequencyText(value) {
    const types = {
        'daily': '매일',
        'weekly': '주 1-2회',
        'biweekly': '2주 1회',
        'monthly': '월 1회',
        'one-time': '1회성'
    };
    return types[value] || value;
}

// 견적 폼 초기화 - 즉시 실행
if (document.getElementById('estimateForm')) {
    initEstimateForm();
} else {
    // DOM이 아직 로드되지 않았다면 DOMContentLoaded 이벤트 대기
    document.addEventListener('DOMContentLoaded', initEstimateForm);
}