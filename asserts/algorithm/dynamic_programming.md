## 动态规划

### 题目2: 给定m行n列的网格，有一个机器人从左上角(0, 0)出发，每一步可以向下或者向右走一步，问有多少种不同的方式走到右下角？

![unique paths](/asserts/unique-path.png)

本题属于计数型动态规划，根据动态规划四个组成部分来实现

#### 2.1 确定状态

* 最后一步：无论机器人用何种方式到达右下角，总有最后挪动的一步：向右或向下
* 右下角坐标设为（m-1, n-1)
* 那么前一步机器人一定是在(m-2, n-1)或者(m-1, n-2)

#### 2.2 子问题

* 那么，如果机器人有X种方式从左上角走到（m-2, n-1)，有Y种方式从左上角走到(m-1, n-2)，则机器人有X+Y种方式走到(m-1, n-1)

> 思考：为什么是X+Y，无重复且无遗漏

* 问题转化为，机器人有多少种方式从左上角走到(m-2, n-1)和(m-1, n-2)。
* 原题要求有多少种方式从左上角走到(m-1, n-1)
* 子问题
* 状态：设f[i][j]为机器人有多少种方式从左上角走到(i, j)

#### 2.3 转移方程

* 对于任意一个格子(i, j)，都有f[i][j] = f[i-1][j] + f[i][j-1]
> 其中f[i][j]表示：机器人有多少种方式走到(i, j)
> f[i-1][j]表示：机器人有多少种方式走到(i-1, j)
> f[i][j-1]表示：机器人有多少种方式走到(i, j-1)

#### 2.3 初始条件和边界情况

* 初始条件：f[0][0] = 1,因为机器人只有一种方式到左上角
* 边界情况：i = 0 或j = 0,则前一步只能有一个方向过来 f[i][j] = 1

#### 2.4 计算顺序

* f[0][0] = 1
* 计算第0行：f[0][0], f[0][1], ..., f[0][n-1]
* 计算第1行：f[1][0], f[1][1], ..., f[1][n-1]
* ...
* 计算第m-1行：f[m-1][0],f[m-1][1], ...，f[m-1][n-1]
* 答案是f[m-1][n-1]
* 时间复杂度（计算步数）：0(MN)，空间复杂度（数组大小）：O(MN)

```java
public class Solution {
    public int uniquePaths(int m, int n) {
        int[][] f = new int[m][n];
        int i,j;
        for (i = 0; i < m; ++i) { // row: up to down;
            for (j = 0; j < n; ++j) { // column: left to right
                if (i == 0 || j == 0) {
                    f[i][j] = 1;
                    continue;
                }
                f[i][j] = f[i -1][j] + f[i][j - 1];
            }
        }
        return f[m-1][n-1];
    }
}
```

### 题目3: 有n块石头分别在x轴的0,1,...,n-1位置，一只青蛙在石头0，想跳到石头n-1，如果青蛙在第i块石头上，它最多可以向右跳距离ai，问青蛙能否跳到石头n-1

例子：输入a=[2,3,1,1,4],输出true，输入a=[3,2,1,0,4],输出false

本题属于存在型动态规划

#### 3.1 确定状态

* 最后一步：如果青蛙能跳到最后一块石头n-1，我们考虑它跳的最后一步
* 这一步是从石头i跳过来，`i<n-1`
* 这需要两个条件同时满足：
  * 青蛙可以跳到石头i
  * 最后一步不超过跳跃的最大距离：`n-1-i<=ai`

#### 3.2 子问题

* 那么，我们需要知道青蛙能不能跳到石头i(`i<n-1`)
* 而我们原来要求青蛙能不能跳到石头n-1
* 子问题
* 状态：设f[j]表示青蛙能不能跳到石头j

#### 3.2 转移方程

* 设f[j]表示青蛙能不能跳到石头j
![jump-game](/asserts/jump-game.png)

#### 3.3 初始条件和边界情况

* 设f[j]表示青蛙能不能跳到石头j
* 初始条件：f[0] = true,因为青蛙一开始就在石头0

#### 3.4 计算顺序

* 设f[j]表示青蛙能不能跳到石头j
* 计算3.2的转移方程
* 初始化f[0] = true
* 计算f[1], f[2], ..., f[n-1]
* 答案是f[n-1]
* 时间复杂度：O(N2)，空间复杂度（数组大小）：O(N)

```java
public class Solution {
    public boolean conJump(int[] A) {
        int n = A.length;
        boolean[] f = new boolean[n];
        f[0] = true; // initialization
        for (int j = 1; j < n; ++j) {
            f[j] = false;
            //enumerate the previous stone the frog jumped from
            for (int i = 0; i < j; ++i) {
                if (f[i] && i + A[i] >= j) {
                    f[j] = true;
                    break;
                }
            }
        }
        return f[n-1];
    }
}
```