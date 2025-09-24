// 현대W&P 메인 페이지 JavaScript - 리팩토링된 버전

document.addEventListener('DOMContentLoaded', function() {
    // 핵심 기능 초기화
    initBannerSlider();
    initModals();
    initMobileMenu();
    initScrollAnimations();
    initSmoothScroll();
    
    // 자동 팝업 모달 (3초 후)
    setTimeout(showRandomModal, 3000);
});

// 배너 슬라이더 - 핵심 기능
function initBannerSlider() {
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.dot');
    const prevBtn = document.querySelector('.slider-prev');
    const nextBtn = document.querySelector('.slider-next');
    
    if (!slides.length) return;
    
    let currentSlide = 0;
    const totalSlides = slides.length;
    
    function showSlide(index) {
        slides.forEach(slide => slide.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));
        
        slides[index].classList.add('active');
        dots[index].classList.add('active');
    }
    
    function nextSlide() {
        currentSlide = (currentSlide + 1) % totalSlides;
        showSlide(currentSlide);
    }
    
    function prevSlide() {
        currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
        showSlide(currentSlide);
    }
    
    // 이벤트 리스너
    if (nextBtn) nextBtn.addEventListener('click', nextSlide);
    if (prevBtn) prevBtn.addEventListener('click', prevSlide);
    
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            currentSlide = index;
            showSlide(currentSlide);
        });
    });
    
    // 자동 슬라이드 (5초마다)
    setInterval(nextSlide, 5000);
}

// 모달 시스템 - 핵심 기능
function initModals() {
    const modalOverlays = document.querySelectorAll('.modal-overlay');
    const modalCloseBtns = document.querySelectorAll('.modal-close');
    
    function openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }
    
    function closeModal(modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
    
    // 닫기 버튼 이벤트
    modalCloseBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal-overlay');
            closeModal(modal);
        });
    });
    
    // 오버레이 클릭 시 모달 닫기
    modalOverlays.forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeModal(overlay);
            }
        });
    });
    
    // ESC 키로 모달 닫기
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            modalOverlays.forEach(overlay => {
                if (overlay.classList.contains('active')) {
                    closeModal(overlay);
                }
            });
        }
    });
    
    // 전역 함수로 모달 열기 기능 제공
    window.openModal = openModal;
}

// 모바일 메뉴 토글 - 핵심 기능
function initMobileMenu() {
    const navToggle = document.querySelector('.nav-toggle');
    const nav = document.querySelector('.nav');
    
    if (!navToggle || !nav) return;
    
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
}

// 랜덤 모달 표시
function showRandomModal() {
    const modals = ['serviceModal', 'deliveryModal', 'eventModal'];
    const randomModal = modals[Math.floor(Math.random() * modals.length)];
    
    // 50% 확률로 모달 표시
    if (Math.random() < 0.5) {
        openModal(randomModal);
    }
}

// 스크롤 애니메이션 - 성능 최적화
function initScrollAnimations() {
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
    const animateElements = document.querySelectorAll('.service-item, .blacklabel-item, .benefit-item');
    animateElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

// 부드러운 스크롤 - 핵심 기능
function initSmoothScroll() {
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