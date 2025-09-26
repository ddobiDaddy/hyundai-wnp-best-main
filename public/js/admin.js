// 관리자 페이지 공통 함수 모듈

// 텍스트 변환 헬퍼 객체
export const TextHelper = {
  serviceTypes: {
    'health': '헬스·스포츠센터',
    'sauna': '대형사우나·찜질방',
    'corporate': '기업체 연수원',
    'school': '학교·학원',
    'other': '기타'
  },
  
  statuses: {
    'pending': '대기중',
    'processing': '처리중',
    'completed': '완료'
  },
  
  laundryTypes: {
    'workout': '운동복',
    'towel': '수건',
    'sauna': '사우나복',
    'uniform': '제복',
    'bedding': '침구류',
    'mixed': '혼합'
  },
  
  frequencies: {
    'daily': '매일',
    'weekly': '주 1-2회',
    'biweekly': '2주 1회',
    'monthly': '월 1회',
    'one-time': '1회성'
  },
  
  getServiceTypeText(value) {
    return this.serviceTypes[value] || value;
  },
  
  getStatusText(value) {
    return this.statuses[value] || value;
  },
  
  getLaundryTypeText(value) {
    return this.laundryTypes[value] || value;
  },
  
  getFrequencyText(value) {
    return this.frequencies[value] || value;
  }
};

// 유틸리티 함수들
export const Utils = {
  formatDate(date) {
    return new Date(date).toLocaleString('ko-KR');
  },
  
  formatDateOnly(date) {
    return new Date(date).toLocaleDateString('ko-KR');
  },
  
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },
  
  showAlert(message, type = 'info') {
    // 향후 더 나은 알림 시스템으로 교체 가능
    alert(message);
  },
  
  showToast(message, type = 'info') {
    // 향후 토스트 알림 구현
    console.log(`[${type.toUpperCase()}] ${message}`);
  }
};

// API 통신 헬퍼
export const ApiHelper = {
  async getEstimateDetail(id) {
    try {
      const response = await fetch(`/admin/estimate/${id}`);
      const result = await response.json();
      
      if (result.success) {
        return { success: true, data: result.data };
      } else {
        return { success: false, message: result.message };
      }
    } catch (error) {
      console.error('견적 문의 조회 오류:', error);
      return { success: false, message: '서버 오류가 발생했습니다.' };
    }
  },
  
  async updateEstimateStatus(id, status, adminNotes) {
    try {
      const response = await fetch(`/admin/estimate/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          adminNotes
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        return { success: true, message: result.message };
      } else {
        return { success: false, message: result.message };
      }
    } catch (error) {
      console.error('상태 업데이트 오류:', error);
      return { success: false, message: '서버 오류가 발생했습니다.' };
    }
  }
};

// DOM 조작 헬퍼
export const DomHelper = {
  createDetailModalContent(estimate) {
    return `
      <div class="detail-grid">
        <div class="detail-section">
          <h4>기본 정보</h4>
          <p><strong>업체명:</strong> ${Utils.escapeHtml(estimate.companyName)}</p>
          <p><strong>담당자:</strong> ${Utils.escapeHtml(estimate.contactName)}</p>
          <p><strong>연락처:</strong> <a href="tel:${estimate.phone}">${estimate.phone}</a></p>
          <p><strong>이메일:</strong> <a href="mailto:${estimate.email}">${estimate.email}</a></p>
        </div>
        <div class="detail-section">
          <h4>서비스 정보</h4>
          <p><strong>서비스 유형:</strong> ${TextHelper.getServiceTypeText(estimate.serviceType)}</p>
          <p><strong>세탁물 종류:</strong> ${TextHelper.getLaundryTypeText(estimate.laundryType)}</p>
          <p><strong>세탁 빈도:</strong> ${TextHelper.getFrequencyText(estimate.frequency)}</p>
          <p><strong>수량:</strong> ${estimate.quantity}kg</p>
          <p><strong>지역:</strong> ${Utils.escapeHtml(estimate.location)}</p>
        </div>
        <div class="detail-section">
          <h4>추가 정보</h4>
          <p><strong>특별 요구사항:</strong> ${Utils.escapeHtml(estimate.specialRequirements || '없음')}</p>
          <p><strong>기타 문의사항:</strong> ${Utils.escapeHtml(estimate.message || '없음')}</p>
        </div>
        <div class="detail-section">
          <h4>관리 정보</h4>
          <p><strong>현재 상태:</strong> <span class="status-badge status-${estimate.status}">${TextHelper.getStatusText(estimate.status)}</span></p>
          <p><strong>등록일:</strong> ${Utils.formatDate(estimate.createdAt)}</p>
          <p><strong>수정일:</strong> ${Utils.formatDate(estimate.updatedAt)}</p>
          <p><strong>관리자 메모:</strong> ${Utils.escapeHtml(estimate.adminNotes || '없음')}</p>
        </div>
      </div>
    `;
  },
  
  filterTableRows(tableBodyId, filterFn) {
    const rows = document.querySelectorAll(`#${tableBodyId} tr`);
    rows.forEach(row => {
      if (filterFn(row)) {
        row.style.display = '';
      } else {
        row.style.display = 'none';
      }
    });
  },
  
  searchTableRows(tableBodyId, searchTerm, searchColumns) {
    const rows = document.querySelectorAll(`#${tableBodyId} tr`);
    const term = searchTerm.toLowerCase();
    
    rows.forEach(row => {
      let found = false;
      searchColumns.forEach(columnIndex => {
        const cellText = row.cells[columnIndex]?.textContent.toLowerCase() || '';
        if (cellText.includes(term)) {
          found = true;
        }
      });
      
      row.style.display = found ? '' : 'none';
    });
  }
};

// 이벤트 핸들러 관리
export const EventHandlers = {
  initModalHandlers(modal, closeBtn, viewBtns) {
    // 모달 열기
    viewBtns.forEach(btn => {
      btn.addEventListener('click', async function() {
        const id = this.getAttribute('data-id');
        await this.showEstimateDetail(id);
      }.bind(this));
    });

    // 모달 닫기
    closeBtn.addEventListener('click', () => this.closeModal());
    window.addEventListener('click', (event) => {
      if (event.target === modal) {
        this.closeModal();
      }
    });
  },
  
  initFilterHandlers(statusFilter, searchInput, searchBtn) {
    statusFilter.addEventListener('change', () => this.filterByStatus());
    searchBtn.addEventListener('click', () => this.searchEstimates());
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.searchEstimates();
      }
    });
  },
  
  initStatusUpdateHandler(updateBtn, statusSelect, adminNotes) {
    updateBtn.addEventListener('click', async () => {
      await this.updateEstimateStatus();
    });
  }
};

// 관리자 페이지 메인 클래스
export class AdminPage {
  constructor() {
    this.currentEstimateId = null;
    this.initializeElements();
    this.bindEvents();
  }
  
  initializeElements() {
    this.modal = document.getElementById('detailModal');
    this.closeBtn = document.querySelector('.close');
    this.viewBtns = document.querySelectorAll('.view-btn');
    this.statusFilter = document.getElementById('statusFilter');
    this.searchInput = document.getElementById('searchInput');
    this.searchBtn = document.getElementById('searchBtn');
    this.statusSelect = document.getElementById('statusSelect');
    this.updateStatusBtn = document.getElementById('updateStatusBtn');
    this.cancelBtn = document.getElementById('cancelBtn');
    this.adminNotes = document.getElementById('adminNotes');
    this.startDate = document.getElementById('startDate');
    this.endDate = document.getElementById('endDate');
    this.clearBtn = document.getElementById('clearBtn');
  }
  
  bindEvents() {
    // 모달 이벤트
    this.viewBtns.forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        await this.showEstimateDetail(id);
      });
    });
    
    this.closeBtn.addEventListener('click', () => this.closeModal());
    window.addEventListener('click', (event) => {
      if (event.target === this.modal) {
        this.closeModal();
      }
    });
    
    // 필터 및 검색 이벤트
    this.statusFilter.addEventListener('change', () => this.applyAllFilters());
    this.searchBtn.addEventListener('click', () => this.applyAllFilters());
    this.searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.applyAllFilters();
      }
    });
    this.clearBtn.addEventListener('click', () => this.clearAllFilters());
    
    // 상태 업데이트 이벤트
    this.updateStatusBtn.addEventListener('click', () => this.updateEstimateStatus());
    // 취소 버튼
    if (this.cancelBtn) {
      this.cancelBtn.addEventListener('click', () => this.closeModal());
    }
    
  }
  
  async showEstimateDetail(id) {
    const result = await ApiHelper.getEstimateDetail(id);
    
    if (result.success) {
      const estimate = result.data;
      this.currentEstimateId = id;
      
      // 모달 내용 채우기
      document.getElementById('modalBody').innerHTML = DomHelper.createDetailModalContent(estimate);
      
      // 상태 선택 초기화
      this.statusSelect.value = estimate.status;
      this.adminNotes.value = estimate.adminNotes || '';
      
      this.modal.style.display = 'block';
    } else {
      Utils.showAlert(result.message, 'error');
    }
  }
  
  closeModal() {
    this.modal.style.display = 'none';
    this.currentEstimateId = null;
  }
  
  async updateEstimateStatus() {
    if (!this.currentEstimateId) return;
    
    const result = await ApiHelper.updateEstimateStatus(
      this.currentEstimateId,
      this.statusSelect.value,
      this.adminNotes.value
    );
    
    if (result.success) {
      Utils.showAlert(result.message, 'success');
      location.reload();
    } else {
      Utils.showAlert(result.message, 'error');
    }
  }
  
  applyAllFilters() {
    const rows = document.querySelectorAll('#estimatesTableBody tr');
    const status = this.statusFilter.value;
    const searchTerm = this.searchInput.value.toLowerCase();
    const startDate = this.startDate.value;
    const endDate = this.endDate.value;
    
    rows.forEach(row => {
      let shouldShow = true;
      
      // 상태 필터
      if (status && row.getAttribute('data-status') !== status) {
        shouldShow = false;
      }
      
      // 검색 필터
      if (searchTerm && shouldShow) {
        const companyName = row.cells[1]?.textContent.toLowerCase() || '';
        const contactName = row.cells[2]?.textContent.toLowerCase() || '';
        const phone = row.cells[3]?.textContent.toLowerCase() || '';
        
        if (!companyName.includes(searchTerm) && 
            !contactName.includes(searchTerm) && 
            !phone.includes(searchTerm)) {
          shouldShow = false;
        }
      }
      
      // 날짜 필터
      if (shouldShow && (startDate || endDate)) {
        const dateCell = row.cells[8]; // 등록일 컬럼
        if (dateCell) {
          const cellDate = new Date(dateCell.textContent);
          const start = startDate ? new Date(startDate) : null;
          const end = endDate ? new Date(endDate) : null;
          
          if (start && cellDate < start) {
            shouldShow = false;
          }
          if (end && cellDate > end) {
            shouldShow = false;
          }
        }
      }
      
      row.style.display = shouldShow ? '' : 'none';
    });
  }
  
  clearAllFilters() {
    this.statusFilter.value = '';
    this.searchInput.value = '';
    this.startDate.value = '';
    this.endDate.value = '';
    
    // 모든 행 다시 표시
    const rows = document.querySelectorAll('#estimatesTableBody tr');
    rows.forEach(row => {
      row.style.display = '';
    });
    
    Utils.showAlert('모든 필터가 초기화되었습니다.', 'info');
  }
}

// 페이지 로드 시 초기화
export function initAdminPage() {
  document.addEventListener('DOMContentLoaded', () => {
    new AdminPage();
  });
}
