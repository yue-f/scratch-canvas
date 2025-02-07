const app = getApp()

Page({
  data: {
    questions: [{
        question: '1、元宵节是中国的哪个传统节日？',
        answer: '答：元宵节是中国的农历正月十五的节日，又称上元节或灯节。',
        clearedArea: 0,
        isDrawing: false,
        answerVisible: ''
      },
      {
        question: '2、元宵节的主要习俗有哪些？',
        answer: '答：元宵节的主要习俗包括赏花灯、吃元宵（或汤圆）、猜灯谜等。',
        clearedArea: 0,
        isDrawing: false,
        answerVisible: ''
      },
      {
        question: '3、“元宵”和“汤圆”有什么区别？',
        answer: '答：元宵是“滚”出来的，以馅为基础，在糯米粉中滚成球形；而汤圆则是“包”出来的，类似于包饺子，将糯米粉团皮包上馅料后捏合成型。',
        clearedArea: 0,
        isDrawing: false,
        answerVisible: '' // 用于逐步显示答案
      },
    ],
    imgSrc: 'https://open.weixin.qq.com/zh_CN/htmledition/res/assets/res-design-download/icon64_wx_logo.png'
  },
  onLoad() {
    this.data.questions.forEach((item, index) => {
      this.initCanvas(index); // 初始化每个 canvas
    });
  },
  initCanvas(index) {
    const query = wx.createSelectorQuery().in(this);
    query.select('#scratchCanvas-' + index)
      .fields({
        node: true,
        size: true
      })
      .exec((res) => {
        const canvas = res[0].node
        const ctx = canvas.getContext('2d')
        const dpr = wx.getSystemInfoSync().pixelRatio

        // 设置canvas的宽高
        canvas.width = res[0].width * dpr
        canvas.height = res[0].height * dpr
        ctx.scale(dpr, dpr)

        // 填充背景色（遮罩）
        ctx.fillStyle = "#f90";
        ctx.fillRect(0, 0, canvas.width, canvas.height)


        // 在图片后面绘制文字
        ctx.font = '20rpx Arial'; // 设置字体大小和字体
        ctx.fillStyle = 'black'; // 设置文字颜色
        ctx.textAlign = 'center'; // 设置文字居中
        ctx.textBaseline = 'middle'; // 设置文字基线为中间

        // 计算文字的位置
        const textX = res[0].width / 2;
        const textY = 10; // 文字位置在图片上方

        // 绘制文字
        ctx.fillText('呱呱查看答案', textX, textY);

        // 图片对象
        const image = canvas.createImage()
        // 设置图片src
        image.src = this.data.imgSrc
        // 图片加载完成回调
        image.onload = () => {
          // 获取图片的原始宽高
          const imgWidth = 64;
          const imgHeight = 64;
          const x = (res[0].width - imgWidth) / 2;
          const Y = (res[0].height - imgHeight) / 2;

          // 将图片绘制到 canvas 上
          ctx.drawImage(image, x, Y)
        }

        // 初始化状态
        this.setData({
          [`questions[${index}].clearedArea`]: 0, // 清除的面积
          [`questions[${index}].isDrawing`]: false, // 是否在绘制
          [`questions[${index}].answerVisible`]: '' // 初始化答案可见部分
        });

      })
  },
  onTouchStart(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({
      [`questions[${index}].isDrawing`]: true,
    });

    this.clearCanvas(e, index);
  },
  onTouchMove(e) {
    const index = e.currentTarget.dataset.index;
    if (this.data.questions[index].isDrawing) {
      this.clearCanvas(e, index);
    }
  },
  onTouchEnd(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({
      [`questions[${index}].isDrawing`]: false,
    });
  },
  // 清除遮罩并计算清除区域
  clearCanvas(e, index) {
    const query = wx.createSelectorQuery().in(this);
    query.select(`#scratchCanvas-${index}`).fields({
      node: true,
      size: true
    }).exec((res) => {
      const canvas = res[0].node;
      const ctx = canvas.getContext('2d');
      // 获取触摸点的坐标
      const touch = e.touches[0];
      const x = touch.x;
      const y = touch.y;
      const radius = 30;

      // 清除圆形区域
      ctx.globalCompositeOperation = 'destination-out'; // 设置清除模式为擦除
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI); // 画圆
      ctx.fill();
      // 更新清除的区域
      this.updateClearedArea(index, x, y, canvas.width, canvas.height);
    });
  },
  // 更新清除的区域，并计算清除比例
  updateClearedArea(index, x, y, canvasWidth, canvasHeight) {
    const clearedArea = this.data.questions[index].clearedArea || 0; // 获取当前清除区域的面积
    const radius = 15 * wx.getSystemInfoSync().pixelRatio; // 清除区域的半径
    const clearSize = Math.PI * Math.pow(radius, 2); // 计算每次清除的圆形区域面积

    // 计算新的清除面积
    const newClearedArea = clearedArea + clearSize;

    // 计算清除比例
    const totalArea = canvasWidth * canvasHeight;
    const clearedPercentage = (newClearedArea / totalArea) * 100;

    // 更新数据，保存新的清除区域面积
    this.setData({
      [`questions[${index}].clearedArea`]: newClearedArea,
    });
    // 逐步显示答案
    this.updateAnswerVisible(index, clearedPercentage);
    // 如果清除的区域超过70%，显示答案
    if (clearedPercentage >= 70) {
      this.showFullAnswer(index);
    }
  },
  // 逐步显示答案
  updateAnswerVisible(index, clearedPercentage) {
    const question = this.data.questions[index];
    const answer = question.answer;

    // 根据清除比例更新显示的答案
    const visibleLength = Math.floor((clearedPercentage / 100) * answer.length);
    this.setData({
      [`questions[${index}].answerVisible`]: answer.substring(0, visibleLength)
    });
  },
  // 显示完整答案
  showFullAnswer(index) {
    this.setData({
      [`questions[${index}].answerVisible`]: this.data.questions[index].answer // 完整显示答案
    });
  },
})