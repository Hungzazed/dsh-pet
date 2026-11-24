/**
 * English and Vietnamese tool-activity speech bubble copy tables for tool-detail.
 * @module dsh-pet/src/host/tool-detail/copy-i18n
 */
import type { ResolvedLanguage } from '../../shared/i18n/core.ts';
import {
  COMMAND_COPY,
  COMMAND_FALLBACK,
  COMMAND_NAME_TOO_LONG,
  TOOL_COPY,
  UNKNOWN_TOOL_LINE,
  type CopyLine,
  type ToolCopy,
} from './copy.ts';

export interface ToolDetailCopyBundle {
  readonly toolCopy: Readonly<Record<string, ToolCopy>>;
  readonly unknownToolLine: CopyLine;
  readonly commandFallback: readonly CopyLine[];
  readonly commandNameTooLong: CopyLine;
  readonly commandCopy: Readonly<Record<string, readonly CopyLine[]>>;
}

const EN_CD: readonly CopyLine[] = [
  'Switching directories~',
  'Moving over to that folder',
  'Hopping to another directory',
];
const EN_LS: readonly CopyLine[] = ['Seeing what files are here', 'Checking this folder', 'Listing the directory'];
const EN_CAT: readonly CopyLine[] = ['Peeking at the file contents', 'Reading what is inside', 'Checking that output'];
const EN_MKDIR: readonly CopyLine[] = ['Making a new folder', 'Setting up a new directory', 'Creating a folder'];
const EN_RM: readonly CopyLine[] = ['Cleaning up unused files', 'Tossing these out', 'Removing old files'];
const EN_MV: readonly CopyLine[] = ['Moving things around', 'Relocating files', 'Shifting it over there'];
const EN_CP: readonly CopyLine[] = ['Making a backup copy', 'Copying a spare one', 'Duplicating files'];
const EN_CURL: readonly CopyLine[] = ['Knocking on that endpoint', 'Pinging the server', 'Fetching from the URL'];
const EN_CHECKOUT: readonly CopyLine[] = [
  'Switching branches~',
  'Checking out that branch',
  'Hopping to another branch',
];

const EN_BUNDLE: ToolDetailCopyBundle = {
  toolCopy: {
    read: {
      lines: ['Reading {target}~', 'Checking what is in {target}', 'Peeking at {target}'],
      short: 'Reading some code',
    },
    read_image: {
      lines: ['Looking at {target}~', 'Checking out {target}', 'Seeing what {target} shows'],
      short: 'Checking an image',
    },
    write: { lines: ['Writing to {target}', 'Creating {target} now', 'Drafting {target}'], short: 'Writing a file' },
    edit: { lines: ['Editing {target}~', 'Tweaking {target}', 'Updating {target}'], short: 'Editing some code' },
    str_replace_editor: {
      lines: ['Editing {target}~', 'Tweaking {target}', 'Updating {target}'],
      short: 'Editing some code',
    },
    glob: { lines: ['Finding {target}~', 'Looking for {target}', 'Scanning for {target}'], short: 'Looking for files' },
    grep: {
      lines: ['Searching for {target}', 'Hunting down {target}', 'Looking up {target}'],
      short: 'Searching the codebase',
    },
    present: {
      lines: ['Showing you {target}~', 'Bringing {target} over', 'Here is {target}'],
      short: 'Showing you a file',
    },
    skill: {
      lines: ['Loading skill {target}', 'Learning {target}~', 'Checking skill {target}'],
      short: 'Learning a skill',
    },
    subagent: {
      lines: ['Calling backup: {target}', 'Asking a helper: {target}', 'Delegating {target}'],
      short: 'Asking a helper',
    },
    subagent_fork: {
      lines: ['Calling backup: {target}', 'Asking a helper: {target}', 'Delegating {target}'],
      short: 'Asking a helper',
    },
    workflow: {
      lines: ['Lining up the steps~', 'Organizing the workflow', 'Taking it step by step'],
      short: 'Planning steps',
    },
    web_search: {
      lines: ['Searching online: {target}', 'Looking up {target}', 'Web search for {target}'],
      short: 'Searching the web',
    },
    web_fetch: { lines: ['Opening {target}~', 'Reading {target}', 'Checking {target}'], short: 'Reading a web page' },
  },
  unknownToolLine: 'Trying out a tool~',
  commandFallback: ['Running {cmd}~', 'Kicking off {cmd}', 'Putting {cmd} to work'],
  commandNameTooLong: 'Running a command~',
  commandCopy: {
    cd: EN_CD,
    'set-location': EN_CD,
    ls: EN_LS,
    dir: EN_LS,
    'get-childitem': EN_LS,
    cat: EN_CAT,
    'get-content': EN_CAT,
    mkdir: EN_MKDIR,
    'new-item': EN_MKDIR,
    rm: EN_RM,
    del: EN_RM,
    'remove-item': EN_RM,
    mv: EN_MV,
    'move-item': EN_MV,
    cp: EN_CP,
    'copy-item': EN_CP,
    curl: EN_CURL,
    'invoke-webrequest': EN_CURL,
    git: ['Working with git~', 'Checking the git repo', 'Running a git task'],
    'git status': ['Checking git status', 'Seeing what changed', 'Inspecting working tree'],
    'git diff': ['Inspecting the diff', 'Seeing what got edited', 'Comparing changes'],
    'git log': ['Reading commit history', 'Checking recent commits', 'Browsing git log'],
    'git add': ['Staging changes~', 'Adding files to git', 'Preparing the commit'],
    'git commit': ['Saving a git commit', 'Recording this snapshot', 'Committing changes'],
    'git push': ['Pushing to remote~', 'Uploading commits', 'Syncing to remote'],
    'git pull': ['Pulling latest changes', 'Syncing from remote', 'Fetching updates'],
    'git fetch': ['Checking remote updates', 'Fetching latest refs', 'Peeking at remote'],
    'git checkout': EN_CHECKOUT,
    'git switch': EN_CHECKOUT,
    'git branch': ['Checking branches', 'Organizing git branches', 'Listing branches'],
    'git merge': ['Merging branches~', 'Combining the changes', 'Joining the branches'],
    'git rebase': ['Tidying commit history', 'Rebasing commits', 'Reordering history'],
    'git stash': ['Stashing changes aside', 'Tucking changes away', 'Saving work in stash'],
    'git clone': ['Cloning the repository', 'Downloading the repo', 'Copying the repo locally'],
    'git reset': ['Rewinding changes', 'Undoing those steps', 'Resetting git state'],
    'git tag': ['Tagging this release', 'Adding a version tag', 'Marking a milestone'],
  },
};

const VI_CD: readonly CopyLine[] = ['Đổi sang thư mục kia chút~', 'Chuyển chỗ làm việc nè', 'Nhảy sang thư mục khác'];
const VI_LS: readonly CopyLine[] = ['Xem trong này có gì nào', 'Ngó qua thư mục chút', 'Liệt kê tệp ở đây'];
const VI_CAT: readonly CopyLine[] = ['Mở xem nội dung nè', 'Đọc xem bên trong viết gì', 'Kiểm tra nội dung tệp'];
const VI_MKDIR: readonly CopyLine[] = ['Tạo thư mục mới nè', 'Dọn sẵn một thư mục mới', 'Mở thêm thư mục'];
const VI_RM: readonly CopyLine[] = ['Dọn mấy tệp không cần nữa', 'Xóa bớt cho gọn nè', 'Đang dọn dẹp tệp'];
const VI_MV: readonly CopyLine[] = ['Chuyển đồ sang chỗ khác', 'Đổi vị trí tệp nè', 'Dời sang bên kia'];
const VI_CP: readonly CopyLine[] = ['Sao chép thêm một bản', 'Tạo bản dự phòng nè', 'Nhân bản tệp'];
const VI_CURL: readonly CopyLine[] = ['Gõ cửa gọi thử API nè', 'Gửi yêu cầu mạng chút', 'Kiểm tra kết nối địa chỉ'];
const VI_CHECKOUT: readonly CopyLine[] = [
  'Chuyển sang nhánh kia xem',
  'Đổi nhánh git chút nè',
  'Sang nhánh khác làm tiếp',
];

const VI_BUNDLE: ToolDetailCopyBundle = {
  toolCopy: {
    read: {
      lines: ['Đọc thử {target} xem sao', 'Xem trong {target} viết gì nè', 'Để em ngó qua {target} nha'],
      short: 'Đang đọc mã nguồn',
    },
    read_image: {
      lines: ['Xem ảnh {target} thế nào nè', 'Để em ngó {target} chút', 'Đang xem ảnh {target}'],
      short: 'Đang xem một bức ảnh',
    },
    write: {
      lines: ['Viết nội dung vào {target}', 'Tạo tệp {target} ngay đây', 'Thêm dữ liệu vào {target}'],
      short: 'Đang viết tệp mới',
    },
    edit: {
      lines: ['Sửa lại {target} chút nè', 'Chỉnh sửa {target} nha', 'Cập nhật {target} ngay'],
      short: 'Đang chỉnh sửa mã',
    },
    str_replace_editor: {
      lines: ['Sửa lại {target} chút nè', 'Chỉnh sửa {target} nha', 'Cập nhật {target} ngay'],
      short: 'Đang chỉnh sửa mã',
    },
    glob: {
      lines: ['Tìm xem {target} ở đâu nè', 'Quét tìm {target} chút', 'Đang tìm tệp {target}'],
      short: 'Đang tìm tệp tin',
    },
    grep: {
      lines: ['Tìm {target} trong mã nè', 'Tra xem {target} nằm đâu', 'Đang tìm kiếm {target}'],
      short: 'Đang lục tìm trong mã',
    },
    present: {
      lines: ['Gửi bạn xem {target} nè', 'Mang {target} ra cho bạn xem', '{target} ở ngay đây ạ'],
      short: 'Mang tệp ra cho bạn xem',
    },
    skill: {
      lines: ['Học thêm kỹ năng {target}', 'Ghi nhớ chiêu {target} nè', 'Đang nạp kỹ năng {target}'],
      short: 'Đang học kỹ năng mới',
    },
    subagent: {
      lines: ['Nhờ trợ thủ giúp: {target}', 'Gọi người phụ {target} nè', 'Giao {target} cho trợ thủ'],
      short: 'Nhờ trợ thủ phụ một tay',
    },
    subagent_fork: {
      lines: ['Nhờ trợ thủ giúp: {target}', 'Gọi người phụ {target} nè', 'Giao {target} cho trợ thủ'],
      short: 'Nhờ trợ thủ phụ một tay',
    },
    workflow: {
      lines: ['Sắp xếp thứ tự việc rồi làm', 'Lên kế hoạch làm từng bước', 'Xử lý từng việc một nha'],
      short: 'Đang sắp xếp công việc',
    },
    web_search: {
      lines: ['Lên mạng tìm {target} nè', 'Tra cứu {target} chút nhé', 'Tìm kiếm {target} trên web'],
      short: 'Đang tìm trên mạng',
    },
    web_fetch: {
      lines: ['Mở trang {target} xem sao', 'Đọc nội dung trên {target}', 'Ngó qua {target} chút nè'],
      short: 'Đang đọc trang web',
    },
  },
  unknownToolLine: 'Đang dùng công cụ mới~',
  commandFallback: ['Chạy thử {cmd} nè', 'Khởi chạy {cmd} rồi nha', 'Để {cmd} làm việc chút'],
  commandNameTooLong: 'Đang chạy một lệnh~',
  commandCopy: {
    cd: VI_CD,
    'set-location': VI_CD,
    ls: VI_LS,
    dir: VI_LS,
    'get-childitem': VI_LS,
    cat: VI_CAT,
    'get-content': VI_CAT,
    mkdir: VI_MKDIR,
    'new-item': VI_MKDIR,
    rm: VI_RM,
    del: VI_RM,
    'remove-item': VI_RM,
    mv: VI_MV,
    'move-item': VI_MV,
    cp: VI_CP,
    'copy-item': VI_CP,
    curl: VI_CURL,
    'invoke-webrequest': VI_CURL,
    git: ['Đang thao tác với git nè', 'Kiểm tra kho git chút', 'Chạy lệnh git nha'],
    'git status': ['Xem đã sửa những gì rồi', 'Kiểm tra trạng thái git', 'Ngó xem thư mục có sạch không'],
    'git diff': ['So sánh xem vừa sửa gì nè', 'Xem chi tiết các chỗ thay đổi', 'Đang kiểm tra git diff'],
    'git log': ['Xem lại lịch sử commit nè', 'Lướt qua mấy bản lưu gần đây', 'Đang đọc git log'],
    'git add': ['Gom các thay đổi lại nè', 'Thêm tệp vào danh sách chờ', 'Chuẩn bị commit'],
    'git commit': ['Lưu lại bản commit nè', 'Ghi dấu mốc công việc', 'Đang tạo commit'],
    'git push': ['Đẩy code lên máy chủ nè', 'Đang push lên remote nha', 'Đồng bộ lên GitHub thôi'],
    'git pull': ['Kéo bản mới nhất về nè', 'Cập nhật code từ remote', 'Đồng bộ bản mới về máy'],
    'git fetch': ['Ngó xem remote có gì mới', 'Lấy trạng thái mới nhất về', 'Đang kiểm tra cập nhật'],
    'git checkout': VI_CHECKOUT,
    'git switch': VI_CHECKOUT,
    'git branch': ['Xem danh sách các nhánh', 'Sắp xếp lại nhánh git nè', 'Kiểm tra các nhánh'],
    'git merge': ['Gộp hai nhánh lại với nhau', 'Đang merge nhánh nè', 'Hợp nhất các thay đổi'],
    'git rebase': ['Sắp xếp lại lịch sử commit', 'Đang rebase gọn gàng nè', 'Chỉnh thứ tự commit'],
    'git stash': ['Cất tạm mấy thay đổi này', 'Giấu tạm sang một bên nhé', 'Đang lưu vào stash'],
    'git clone': ['Tải cả kho mã nguồn về', 'Đang clone repository nè', 'Chép kho về máy'],
    'git reset': ['Quay lại trạng thái trước', 'Hoàn tác vài bước vừa rồi', 'Đang đặt lại git'],
    'git tag': ['Gắn thẻ phiên bản nè', 'Đánh dấu bản phát hành', 'Ghi nhận cột mốc mới'],
  },
};

const ZH_BUNDLE: ToolDetailCopyBundle = {
  toolCopy: TOOL_COPY,
  unknownToolLine: UNKNOWN_TOOL_LINE,
  commandFallback: COMMAND_FALLBACK,
  commandNameTooLong: COMMAND_NAME_TOO_LONG,
  commandCopy: COMMAND_COPY,
};

/** Return the tool-detail copy bundle for the specified language. */
export function copyBundleOf(lang: ResolvedLanguage = 'zh'): ToolDetailCopyBundle {
  if (lang === 'vi') return VI_BUNDLE;
  if (lang === 'en') return EN_BUNDLE;
  return ZH_BUNDLE;
}
