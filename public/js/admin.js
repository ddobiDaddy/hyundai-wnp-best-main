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
    this.currentPage = 1;
    this.itemsPerPage = 5;
    this.sortBy = 'createdAt';
    this.sortOrder = 'desc';
    this.totalPages = 1;
    this.initializeElements();
    this.bindEvents();
    this.renderTable(); // 초기 렌더링
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
    
    // 페이징 및 정렬 요소들
    this.itemsPerPageSelect = document.getElementById('itemsPerPage');
    this.sortBySelect = document.getElementById('sortBy');
    this.sortOrderSelect = document.getElementById('sortOrder');
    this.paginationInfo = document.getElementById('paginationInfo');
    this.firstPageBtn = document.getElementById('firstPage');
    this.prevPageBtn = document.getElementById('prevPage');
    this.nextPageBtn = document.getElementById('nextPage');
    this.lastPageBtn = document.getElementById('lastPage');
    this.pageNumbers = document.getElementById('pageNumbers');
    this.sortableHeaders = document.querySelectorAll('.sortable');
    this.tableBody = document.getElementById('estimatesTableBody');
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
    
    // 페이징 및 정렬 이벤트
    this.itemsPerPageSelect.addEventListener('change', () => {
      this.itemsPerPage = parseInt(this.itemsPerPageSelect.value);
      this.currentPage = 1;
      this.renderTable();
    });
    
    this.sortBySelect.addEventListener('change', () => {
      this.sortBy = this.sortBySelect.value;
      this.renderTable();
    });
    
    this.sortOrderSelect.addEventListener('change', () => {
      this.sortOrder = this.sortOrderSelect.value;
      this.renderTable();
    });
    
    // 페이징 버튼 이벤트
    this.firstPageBtn.addEventListener('click', () => this.goToPage(1));
    this.prevPageBtn.addEventListener('click', () => this.goToPage(this.currentPage - 1));
    this.nextPageBtn.addEventListener('click', () => this.goToPage(this.currentPage + 1));
    this.lastPageBtn.addEventListener('click', () => this.goToPage(this.totalPages));
    
    // 정렬 가능한 헤더 클릭 이벤트
    this.sortableHeaders.forEach(header => {
      header.addEventListener('click', () => {
        const sortField = header.getAttribute('data-sort');
        if (this.sortBy === sortField) {
          this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
        } else {
          this.sortBy = sortField;
          this.sortOrder = 'asc';
        }
        this.updateSortSelects();
        this.renderTable();
      });
    });
    
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
    this.currentPage = 1; // 필터 적용 시 첫 페이지로 이동
    this.renderTable();
  }
  
  clearAllFilters() {
    this.statusFilter.value = '';
    this.searchInput.value = '';
    this.startDate.value = '';
    this.endDate.value = '';
    this.currentPage = 1;
    
    Utils.showAlert('모든 필터가 초기화되었습니다.', 'info');
    this.renderTable();
  }
  
  // 페이징 및 정렬 관련 메서드들
  async renderTable() {
    const estimates = await this.getFilteredEstimates();
    const sortedEstimates = this.sortEstimates(estimates);
    this.totalPages = Math.ceil(sortedEstimates.length / this.itemsPerPage);
    
    // 현재 페이지가 총 페이지 수를 초과하면 첫 페이지로
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = 1;
    }
    
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    const pageEstimates = sortedEstimates.slice(startIndex, endIndex);
    
    this.renderTableRows(pageEstimates);
    this.renderPagination(sortedEstimates.length);
    this.updateSortHeaders();
  }
  
  async getFilteredEstimates() {
    // 서버에서 모든 데이터를 가져와서 클라이언트에서 필터링
    const response = await fetch('/admin');
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const rows = doc.querySelectorAll('#estimatesTableBody tr');
    
    const estimates = [];
    rows.forEach(row => {
      const id = row.getAttribute('data-id');
      if (id) {
        estimates.push({
          id: parseInt(id),
          companyName: row.cells[1]?.textContent || '',
          contactName: row.cells[2]?.textContent || '',
          phone: row.cells[3]?.textContent || '',
          serviceType: row.cells[4]?.textContent || '',
          quantity: row.cells[5]?.textContent || '',
          location: row.cells[6]?.textContent || '',
          status: row.getAttribute('data-status') || '',
          createdAt: new Date(row.cells[8]?.textContent || '')
        });
      }
    });
    
    return this.applyFilters(estimates);
  }
  
  applyFilters(estimates) {
    let filtered = [...estimates];
    
    // 상태 필터
    const status = this.statusFilter.value;
    if (status) {
      filtered = filtered.filter(estimate => estimate.status === status);
    }
    
    // 검색 필터
    const searchTerm = this.searchInput.value.toLowerCase();
    if (searchTerm) {
      filtered = filtered.filter(estimate => 
        estimate.companyName.toLowerCase().includes(searchTerm) ||
        estimate.contactName.toLowerCase().includes(searchTerm) ||
        estimate.phone.toLowerCase().includes(searchTerm)
      );
    }
    
    // 날짜 필터
    const startDate = this.startDate.value;
    const endDate = this.endDate.value;
    if (startDate || endDate) {
      filtered = filtered.filter(estimate => {
        const estimateDate = new Date(estimate.createdAt);
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;
        
        if (start && estimateDate < start) return false;
        if (end && estimateDate > end) return false;
        return true;
      });
    }
    
    return filtered;
  }
  
  sortEstimates(estimates) {
    return estimates.sort((a, b) => {
      let aValue = a[this.sortBy];
      let bValue = b[this.sortBy];
      
      // 날짜 정렬
      if (this.sortBy === 'createdAt') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }
      
      // 문자열 정렬
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (this.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }
  
  renderTableRows(estimates) {
    const tbody = this.tableBody;
    tbody.innerHTML = '';
    
    estimates.forEach(estimate => {
      const row = document.createElement('tr');
      row.setAttribute('data-id', estimate.id);
      row.setAttribute('data-status', estimate.status);
      
      row.innerHTML = `
        <td>${estimate.id}</td>
        <td>${estimate.companyName}</td>
        <td>${estimate.contactName}</td>
        <td><a href="tel:${estimate.phone}" class="phone-link">${estimate.phone}</a></td>
        <td>${TextHelper.getServiceTypeText(estimate.serviceType)}</td>
        <td>${estimate.quantity}</td>
        <td>${estimate.location}</td>
        <td><span class="status-badge status-${estimate.status}">${TextHelper.getStatusText(estimate.status)}</span></td>
        <td>${new Date(estimate.createdAt).toLocaleDateString('ko-KR')}</td>
        <td><button class="btn btn-sm btn-primary view-btn" data-id="${estimate.id}">상세보기</button></td>
      `;
      
      // 상세보기 버튼 이벤트 추가
      const viewBtn = row.querySelector('.view-btn');
      viewBtn.addEventListener('click', async () => {
        await this.showEstimateDetail(estimate.id);
      });
      
      tbody.appendChild(row);
    });
  }
  
  renderPagination(totalItems) {
    const startItem = (this.currentPage - 1) * this.itemsPerPage + 1;
    const endItem = Math.min(this.currentPage * this.itemsPerPage, totalItems);
    
    this.paginationInfo.textContent = `전체 ${totalItems}개 중 ${startItem}-${endItem}개 표시`;
    
    // 페이징 버튼 상태 업데이트
    this.firstPageBtn.disabled = this.currentPage === 1;
    this.prevPageBtn.disabled = this.currentPage === 1;
    this.nextPageBtn.disabled = this.currentPage === this.totalPages || this.totalPages === 0;
    this.lastPageBtn.disabled = this.currentPage === this.totalPages || this.totalPages === 0;
    
    // 페이지 번호 생성
    this.renderPageNumbers();
  }
  
  renderPageNumbers() {
    this.pageNumbers.innerHTML = '';
    
    const maxVisiblePages = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      const pageBtn = document.createElement('button');
      pageBtn.className = `page-number ${i === this.currentPage ? 'active' : ''}`;
      pageBtn.textContent = i;
      pageBtn.addEventListener('click', () => this.goToPage(i));
      this.pageNumbers.appendChild(pageBtn);
    }
  }
  
  goToPage(page) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.renderTable();
    }
  }
  
  updateSortSelects() {
    this.sortBySelect.value = this.sortBy;
    this.sortOrderSelect.value = this.sortOrder;
  }
  
  updateSortHeaders() {
    this.sortableHeaders.forEach(header => {
      header.classList.remove('active', 'asc', 'desc');
      if (header.getAttribute('data-sort') === this.sortBy) {
        header.classList.add('active', this.sortOrder);
      }
    });
  }
}

// 페이지 로드 시 초기화
export function initAdminPage() {
  document.addEventListener('DOMContentLoaded', () => {
    new AdminPage();
  });
}
